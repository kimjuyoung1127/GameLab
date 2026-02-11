import logging
import os
import shutil
import subprocess
import uuid
import wave
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.jobs.router import register_job, set_job_status
from app.core.config import settings
from app.core.supabase_client import supabase
from app.models.schemas import UploadJobStatus, UploadResult

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)


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


def _write_uploads_atomically(
    *,
    session_payload: dict,
    uploaded_records: list[dict],
    created_suggestions: list[dict],
):
    # Preferred path: single RPC transaction in Postgres.
    try:
        supabase.rpc(
            "create_upload_session_with_files",
            {
                "p_session": session_payload,
                "p_files": uploaded_records,
                "p_suggestions": created_suggestions,
            },
        ).execute()
        return
    except Exception:
        logger.warning("RPC create_upload_session_with_files failed. Falling back to compensating writes.")

    session_written = False
    files_written = False
    suggestions_written = False

    try:
        supabase.table("sst_sessions").upsert(session_payload).execute()
        session_written = True

        if uploaded_records:
            supabase.table("sst_audio_files").insert(uploaded_records).execute()
            files_written = True

        if created_suggestions:
            supabase.table("sst_suggestions").insert(created_suggestions).execute()
            suggestions_written = True
    except Exception as exc:
        logger.exception("Upload DB write failed; starting compensation rollback")
        try:
            audio_ids = [r.get("id") for r in uploaded_records if r.get("id")]
            if suggestions_written and audio_ids:
                supabase.table("sst_suggestions").delete().in_("audio_id", audio_ids).execute()
            if files_written and audio_ids:
                supabase.table("sst_audio_files").delete().in_("id", audio_ids).execute()
            if session_written:
                supabase.table("sst_sessions").delete().eq("id", session_payload["id"]).execute()
        except Exception:
            logger.exception("Compensation rollback failed")
        raise exc


@router.post("/files", response_model=list[UploadResult])
async def upload_files(files: list[UploadFile] = File(...)):
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    results: list[UploadResult] = []
    uploaded_records: list[dict] = []
    created_suggestions: list[dict] = []

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

        content = await f.read()
        if len(content) > max_bytes:
            results.append(
                UploadResult(
                    file_id=file_id,
                    filename=f.filename or "unknown",
                    status=UploadJobStatus.failed,
                    error="File too large",
                )
            )
            continue

        ext = os.path.splitext(f.filename or "")[1].lower()
        save_path = os.path.join(settings.upload_dir, f"{file_id}{ext}")
        with open(save_path, "wb") as out:
            out.write(content)

        duration, sample_rate = _extract_audio_metadata(save_path, ext)

        job_id = str(uuid.uuid4())
        register_job(job_id, UploadJobStatus.queued, session_id=session_id, file_count=1)
        set_job_status(job_id, status=UploadJobStatus.processing, progress=30)

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
        created_suggestions.append(
            {
                "id": f"sug-{uuid.uuid4().hex[:8]}",
                "audio_id": file_id,
                "label": "Potential anomaly",
                "confidence": 72,
                "description": "Auto-generated placeholder suggestion from upload.",
                "start_time": 12.0,
                "end_time": 18.0,
                "freq_low": 1200,
                "freq_high": 3800,
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        results.append(
            UploadResult(
                file_id=file_id,
                filename=f.filename or "unknown",
                status=UploadJobStatus.queued,
                job_id=job_id,
                session_id=session_id,
                progress=30,
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
        }

        try:
            _write_uploads_atomically(
                session_payload=session_payload,
                uploaded_records=uploaded_records,
                created_suggestions=created_suggestions,
            )
            for item in results:
                if item.job_id:
                    set_job_status(
                        item.job_id,
                        status=UploadJobStatus.done,
                        progress=100,
                        session_id=session_id,
                        file_count=len(uploaded_records),
                    )
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
