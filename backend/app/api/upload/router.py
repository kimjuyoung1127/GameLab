"""업로드 API: 멀티파트 파일 업로드, 확장자/크기 검증, 비동기 분석 트리거."""
import logging
import os
import shutil
import subprocess
import uuid
import wave
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import CurrentUser, get_optional_current_user
from app.services.job_manager import register_job, set_job_status
from app.core.config import settings
from app.core.supabase_client import supabase
from app.models.upload import UploadJobStatus, UploadResult
from app.services.analysis.service import AnalysisService

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)
CHUNK_SIZE_BYTES = 1024 * 1024


def _validate_extension(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in settings.allowed_extensions


def _format_duration(seconds: float) -> str:
    total = max(0, int(round(seconds)))
    hh = total // 3600
    mm = (total % 3600) // 60
    ss = total % 60
    return f"{hh:02d}:{mm:02d}:{ss:02d}"


def _format_sample_rate(rate_hz: int | None) -> str:
    if not rate_hz or rate_hz <= 0:
        return "Unknown"
    if rate_hz % 1000 == 0:
        return f"{rate_hz // 1000}kHz"
    return f"{rate_hz / 1000:.1f}kHz"


def _extract_audio_metadata(file_path: str, ext: str) -> tuple[str, str]:
    duration_seconds: float | None = None
    sample_rate_hz: int | None = None

    if ext == ".wav":
        try:
            with wave.open(file_path, "rb") as wf:
                frames = wf.getnframes()
                sample_rate_hz = wf.getframerate()
                if sample_rate_hz and sample_rate_hz > 0:
                    duration_seconds = frames / sample_rate_hz
        except Exception:
            logger.exception("Failed to read WAV metadata", extra={"file_path": file_path})

    if duration_seconds is None or sample_rate_hz is None:
        ffprobe_path = shutil.which("ffprobe")
        if ffprobe_path:
            try:
                proc = subprocess.run(
                    [
                        ffprobe_path,
                        "-v",
                        "error",
                        "-print_format",
                        "json",
                        "-show_streams",
                        "-show_format",
                        file_path,
                    ],
                    capture_output=True,
                    text=True,
                    check=True,
                )
                import json

                payload = json.loads(proc.stdout)
                streams = payload.get("streams", [])
                audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})
                sr = audio_stream.get("sample_rate")
                if sr:
                    sample_rate_hz = int(float(sr))
                fmt = payload.get("format", {})
                dur = fmt.get("duration")
                if dur:
                    duration_seconds = float(dur)
            except Exception:
                logger.exception("Failed to read ffprobe metadata", extra={"file_path": file_path})

    return (
        _format_duration(duration_seconds or 0),
        _format_sample_rate(sample_rate_hz),
    )


def _build_audio_url(file_id: str, ext: str) -> str:
    base = settings.public_file_base_url.rstrip("/")
    return f"{base}/uploads/{file_id}{ext}"


async def _save_file_with_size_limit(
    upload: UploadFile,
    destination_path: str,
    max_bytes: int,
) -> None:
    total = 0
    try:
        with open(destination_path, "wb") as out:
            while True:
                chunk = await upload.read(CHUNK_SIZE_BYTES)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise ValueError("File too large")
                out.write(chunk)
    except Exception:
        if os.path.exists(destination_path):
            try:
                os.remove(destination_path)
            except Exception:
                logger.exception("Failed to clean up oversized upload", extra={"path": destination_path})
        raise


async def _run_analysis_jobs(session_id: str, uploaded_records: list[dict]) -> None:
    analysis = AnalysisService()
    for record in uploaded_records:
        job_id = record.get("job_id")
        if not job_id:
            continue

        set_job_status(
            job_id,
            status=UploadJobStatus.processing,
            progress=40,
            session_id=session_id,
            file_count=1,
        )

        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            file_path = os.path.join(
                settings.upload_dir,
                f"{record['id']}{record.get('ext', '').lower()}",
            )
            drafts = await analysis.analyze(file_path)
            suggestion_rows = [
                {
                    "id": f"sug-{uuid.uuid4().hex[:8]}",
                    "audio_id": record["id"],
                    "label": d.label,
                    "confidence": d.confidence,
                    "description": d.description,
                    "start_time": d.start_time,
                    "end_time": d.end_time,
                    "freq_low": d.freq_low,
                    "freq_high": d.freq_high,
                    "status": "pending",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
                for d in drafts
            ]
            if suggestion_rows:
                supabase.table("sst_suggestions").insert(suggestion_rows).execute()

            set_job_status(
                job_id,
                status=UploadJobStatus.done,
                progress=100,
                session_id=session_id,
                file_count=1,
            )
        except Exception:
            logger.exception("Analysis failed for file %s", record["id"])
            set_job_status(
                job_id,
                status=UploadJobStatus.failed,
                progress=100,
                error="Analysis failed",
                session_id=session_id,
                file_count=1,
            )

    # Update session status after all files processed
    try:
        supabase.table("sst_sessions").update(
            {"status": "completed"}
        ).eq("id", session_id).execute()
    except Exception:
        logger.exception("Failed to update session status after analysis")


def _write_uploads_atomically(
    *,
    session_payload: dict,
    uploaded_records: list[dict],
):
    # Preferred path: single RPC transaction in Postgres.
    try:
        supabase.rpc(
            "create_upload_session_with_files",
            {
                "p_session": session_payload,
                "p_files": uploaded_records,
                "p_suggestions": [],
            },
        ).execute()
        return
    except Exception:
        logger.warning("RPC create_upload_session_with_files failed. Falling back to compensating writes.")

    session_written = False
    files_written = False

    try:
        supabase.table("sst_sessions").upsert(session_payload).execute()
        session_written = True

        if uploaded_records:
            supabase.table("sst_audio_files").insert(uploaded_records).execute()
            files_written = True
    except Exception as exc:
        logger.exception("Upload DB write failed; starting compensation rollback")
        try:
            audio_ids = [r.get("id") for r in uploaded_records if r.get("id")]
            if files_written and audio_ids:
                supabase.table("sst_audio_files").delete().in_("id", audio_ids).execute()
            if session_written:
                supabase.table("sst_sessions").delete().eq("id", session_payload["id"]).execute()
        except Exception:
            logger.exception("Compensation rollback failed")
        raise exc


@router.post("/files", response_model=list[UploadResult])
async def upload_files(
    files: list[UploadFile] = File(...),
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    results: list[UploadResult] = []
    uploaded_records: list[dict] = []
    analysis_records: list[dict] = []

    os.makedirs(settings.upload_dir, exist_ok=True)
    session_id = f"SES-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"
    session_name = f"Upload {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"

    for f in files:
        file_id = str(uuid.uuid4())
        job_id: Optional[str] = None

        if not _validate_extension(f.filename or ""):
            results.append(
                UploadResult(
                    file_id=file_id,
                    filename=f.filename or "unknown",
                    status=UploadJobStatus.failed,
                    error="Unsupported file extension",
                )
            )
            continue

        ext = os.path.splitext(f.filename or "")[1].lower()
        save_path = os.path.join(settings.upload_dir, f"{file_id}{ext}")
        try:
            await _save_file_with_size_limit(f, save_path, max_bytes)
        except ValueError:
            results.append(
                UploadResult(
                    file_id=file_id,
                    filename=f.filename or "unknown",
                    status=UploadJobStatus.failed,
                    error="File too large",
                )
            )
            continue
        except Exception:
            logger.exception("Failed to save upload", extra={"filename": f.filename})
            results.append(
                UploadResult(
                    file_id=file_id,
                    filename=f.filename or "unknown",
                    status=UploadJobStatus.failed,
                    error="Failed to save file",
                )
            )
            continue

        duration, sample_rate = _extract_audio_metadata(save_path, ext)

        job_id = str(uuid.uuid4())
        # Job row must exist before session row is guaranteed; set session_id later.
        register_job(job_id, UploadJobStatus.queued, file_count=1)

        uploaded_records.append(
            {
                "id": file_id,
                "session_id": session_id,
                "filename": f.filename or "unknown",
                "duration": duration,
                "sample_rate": sample_rate,
                "status": "pending",
                "audio_url": _build_audio_url(file_id, ext),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        analysis_records.append({"id": file_id, "ext": ext, "job_id": job_id})

        results.append(
            UploadResult(
                file_id=file_id,
                filename=f.filename or "unknown",
                status=UploadJobStatus.queued,
                job_id=job_id,
                session_id=session_id,
                progress=0,
            )
        )

    if uploaded_records:
        now_iso = datetime.now(timezone.utc).isoformat()
        session_payload = {
            "id": session_id,
            "name": session_name,
            "device_type": "Mobile Recording",
            "status": "processing",
            "file_count": len(uploaded_records),
            "progress": 100,
            "score": None,
            "created_at": now_iso,
            "user_id": current_user.id if current_user else None,
        }

        try:
            _write_uploads_atomically(
                session_payload=session_payload,
                uploaded_records=uploaded_records,
            )

            asyncio.create_task(_run_analysis_jobs(session_id, analysis_records))
        except Exception:
            for item in results:
                if item.job_id:
                    set_job_status(
                        item.job_id,
                        status=UploadJobStatus.failed,
                        progress=100,
                        error="DB write failed",
                        session_id=session_id,
                        file_count=len(uploaded_records),
                    )
            raise HTTPException(status_code=503, detail="Upload persistence failed")

    return results
