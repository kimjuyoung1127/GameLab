import csv
import io
import json as json_module
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
from app.models.labeling import SuggestionResponse, SuggestionStatusValue, UpdateSuggestionRequest
from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/labeling", tags=["labeling"])
logger = logging.getLogger(__name__)


@router.get("/{session_id}/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(session_id: str):
    # 세션에 속한 오디오 파일 ID 목록 조회
    try:
        file_res = (
            supabase.table("sst_audio_files")
            .select("id")
            .eq("session_id", session_id)
            .execute()
        )
        file_ids = [f["id"] for f in (file_res.data or [])]
    except Exception as exc:
        logger.exception("Failed to fetch session audio ids", extra={"session_id": session_id})
        raise HTTPException(status_code=503, detail="Failed to load labeling files") from exc

    if not file_ids:
        return []

    # 해당 파일들의 제안 조회
    try:
        sug_res = (
            supabase.table("sst_suggestions")
            .select("*")
            .in_("audio_id", file_ids)
            .order("created_at", desc=True)
            .execute()
        )
        rows = sug_res.data or []
    except Exception as exc:
        logger.exception("Failed to fetch suggestions", extra={"session_id": session_id})
        raise HTTPException(status_code=503, detail="Failed to load suggestions") from exc

    return [_row_to_response(s) for s in rows]


def _row_to_response(s: dict) -> SuggestionResponse:
    raw_status = s.get("status", SuggestionStatusValue.pending.value)
    try:
        status = SuggestionStatusValue(raw_status)
    except ValueError:
        status = SuggestionStatusValue.pending

    return SuggestionResponse(
        id=s.get("id", ""),
        audio_id=s.get("audio_id", ""),
        label=s.get("label", "Suggestion"),
        confidence=int(s.get("confidence", 0)),
        description=s.get("description", ""),
        start_time=float(s.get("start_time", 0)),
        end_time=float(s.get("end_time", 0)),
        freq_low=float(s.get("freq_low", 0)),
        freq_high=float(s.get("freq_high", 0)),
        status=status,
    )


@router.patch("/suggestions/{suggestion_id}", response_model=SuggestionResponse)
async def update_suggestion_status(suggestion_id: str, body: UpdateSuggestionRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        res = (
            supabase.table("sst_suggestions")
            .update({"status": body.status.value, "updated_at": now_iso})
            .eq("id", suggestion_id)
            .execute()
        )
        rows = res.data or []
    except Exception as exc:
        logger.exception("Failed to update suggestion", extra={"suggestion_id": suggestion_id})
        raise HTTPException(status_code=503, detail="Failed to update suggestion") from exc

    if not rows:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    return _row_to_response(rows[0])


@router.get("/{session_id}/export")
async def export_suggestions(session_id: str, format: str = "csv"):
    """Export all suggestions for a session as CSV or JSON."""
    if format not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")

    # Get audio files for session
    try:
        file_res = (
            supabase.table("sst_audio_files")
            .select("id, filename")
            .eq("session_id", session_id)
            .execute()
        )
        file_rows = file_res.data or []
        file_ids = [f["id"] for f in file_rows]
        filename_map = {f["id"]: f["filename"] for f in file_rows}
    except Exception as exc:
        logger.exception("Export: failed to fetch files")
        raise HTTPException(status_code=503, detail="Failed to export") from exc

    if not file_ids:
        raise HTTPException(status_code=404, detail="No files found for session")

    # Get suggestions
    try:
        sug_res = (
            supabase.table("sst_suggestions")
            .select("*")
            .in_("audio_id", file_ids)
            .order("audio_id")
            .order("start_time")
            .execute()
        )
        rows = sug_res.data or []
    except Exception as exc:
        logger.exception("Export: failed to fetch suggestions")
        raise HTTPException(status_code=503, detail="Failed to export") from exc

    if format == "json":
        export_data = [
            {
                "sessionId": session_id,
                "audioId": r.get("audio_id", ""),
                "filename": filename_map.get(r.get("audio_id", ""), ""),
                "label": r.get("label", ""),
                "confidence": r.get("confidence", 0),
                "startTime": r.get("start_time", 0),
                "endTime": r.get("end_time", 0),
                "freqLow": r.get("freq_low", 0),
                "freqHigh": r.get("freq_high", 0),
                "status": r.get("status", ""),
                "description": r.get("description", ""),
            }
            for r in rows
        ]
        content = json_module.dumps(export_data, indent=2, ensure_ascii=False)
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="labels-{session_id}.json"'},
        )

    # CSV format
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "session_id", "audio_id", "filename", "label", "confidence",
        "start_time", "end_time", "freq_low", "freq_high", "status", "description",
    ])
    for r in rows:
        writer.writerow([
            session_id,
            r.get("audio_id", ""),
            filename_map.get(r.get("audio_id", ""), ""),
            r.get("label", ""),
            r.get("confidence", 0),
            r.get("start_time", 0),
            r.get("end_time", 0),
            r.get("freq_low", 0),
            r.get("freq_high", 0),
            r.get("status", ""),
            r.get("description", ""),
        ])

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="labels-{session_id}.csv"'},
    )
