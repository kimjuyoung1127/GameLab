"""Labeling API: suggestion list, status updates, and CSV/JSON export."""
import csv
import io
import json as json_module
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.auth import CurrentUser, ensure_sst_user_exists, get_current_user
from app.core.supabase_client import supabase
from app.models.labeling import (
    CreateSuggestionsRequest,
    SuggestionResponse,
    SuggestionStatusValue,
    UpdateSuggestionRequest,
)

router = APIRouter(prefix="/api/labeling", tags=["labeling"])
logger = logging.getLogger(__name__)


@router.get("/{session_id}/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(session_id: str):
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


@router.patch("/suggestions/{suggestion_id}", response_model=SuggestionResponse)
async def update_suggestion(
    suggestion_id: str,
    body: UpdateSuggestionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")

    now_iso = datetime.now(timezone.utc).isoformat()

    # Build dynamic update payload (only non-None fields)
    update_payload: dict = {"updated_at": now_iso}
    if body.status is not None:
        update_payload["status"] = body.status.value
    if body.label is not None:
        update_payload["label"] = body.label
    if body.description is not None:
        update_payload["description"] = body.description
    if body.start_time is not None:
        update_payload["start_time"] = body.start_time
    if body.end_time is not None:
        update_payload["end_time"] = body.end_time
    if body.freq_low is not None:
        update_payload["freq_low"] = body.freq_low
    if body.freq_high is not None:
        update_payload["freq_high"] = body.freq_high

    try:
        res = (
            supabase.table("sst_suggestions")
            .update(update_payload)
            .eq("id", suggestion_id)
            .execute()
        )
        rows = res.data or []
    except Exception as exc:
        logger.exception("Failed to update suggestion", extra={"suggestion_id": suggestion_id})
        raise HTTPException(status_code=503, detail="Failed to update suggestion") from exc

    if not rows:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if body.status is not None:
        _update_user_score(body.status, current_user.id)

    return _row_to_response(rows[0])


@router.delete("/suggestions/{suggestion_id}", status_code=204)
async def delete_suggestion(
    suggestion_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a user-created suggestion. AI suggestions cannot be deleted."""
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")

    try:
        fetch_res = (
            supabase.table("sst_suggestions")
            .select("id, source, created_by")
            .eq("id", suggestion_id)
            .limit(1)
            .execute()
        )
        rows = getattr(fetch_res, "data", None) or []
    except Exception as exc:
        logger.exception("Failed to fetch suggestion for delete", extra={"suggestion_id": suggestion_id})
        raise HTTPException(status_code=503, detail="Failed to delete suggestion") from exc

    if not rows:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    row = rows[0]
    if row.get("source") != "user":
        raise HTTPException(status_code=403, detail="AI suggestions cannot be deleted")
    if row.get("created_by") != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this suggestion")

    try:
        supabase.table("sst_suggestions").delete().eq("id", suggestion_id).execute()
    except Exception as exc:
        logger.exception("Failed to delete suggestion", extra={"suggestion_id": suggestion_id})
        raise HTTPException(status_code=503, detail="Failed to delete suggestion") from exc


@router.post("/{session_id}/suggestions", response_model=List[SuggestionResponse])
async def create_manual_suggestions(
    session_id: str,
    body: CreateSuggestionsRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")

    if not body.suggestions:
        return []

    try:
        file_res = (
            supabase.table("sst_audio_files")
            .select("id")
            .eq("session_id", session_id)
            .execute()
        )
        valid_file_ids = {f["id"] for f in (file_res.data or [])}
    except Exception as exc:
        logger.exception("Failed to validate session files", extra={"session_id": session_id})
        raise HTTPException(status_code=503, detail="Failed to create suggestions") from exc

    now_iso = datetime.now(timezone.utc).isoformat()
    rows_to_insert: list[dict] = []
    for item in body.suggestions:
        if item.audio_id not in valid_file_ids:
            raise HTTPException(status_code=400, detail=f"audio_id '{item.audio_id}' is not in this session")
        rows_to_insert.append(
            {
                "audio_id": item.audio_id,
                "label": item.label,
                "confidence": item.confidence,
                "description": item.description,
                "start_time": item.start_time,
                "end_time": item.end_time,
                "freq_low": item.freq_low,
                "freq_high": item.freq_high,
                "status": SuggestionStatusValue.pending.value,
                "source": "user",
                "created_by": current_user.id,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        )

    try:
        insert_res = supabase.table("sst_suggestions").insert(rows_to_insert).execute()
        created_rows = insert_res.data or []
    except Exception:
        # Fallback for environments where source/created_by columns are not migrated yet.
        rows_fallback = []
        for row in rows_to_insert:
            row = row.copy()
            row.pop("source", None)
            row.pop("created_by", None)
            rows_fallback.append(row)
        try:
            insert_res = supabase.table("sst_suggestions").insert(rows_fallback).execute()
            created_rows = insert_res.data or []
        except Exception as exc:
            logger.exception("Failed to create manual suggestions", extra={"session_id": session_id})
            raise HTTPException(status_code=503, detail="Failed to create suggestions") from exc

    return [_row_to_response(r) for r in created_rows]


@router.get("/{session_id}/export")
async def export_suggestions(
    session_id: str,
    format: str = "csv",
    status: str | None = Query(None, description="Comma-separated status filter, e.g. confirmed,corrected"),
):
    """Export suggestions for a session as CSV or JSON. Optionally filter by status."""
    if format not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")

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

    try:
        query = (
            supabase.table("sst_suggestions")
            .select("*")
            .in_("audio_id", file_ids)
        )
        if status:
            statuses = [s.strip() for s in status.split(",") if s.strip()]
            if statuses:
                # AI suggestions filtered by status + all user-created suggestions
                # (user labels are inherently "labeled" data regardless of status)
                status_csv = ",".join(statuses)
                query = query.or_(f"status.in.({status_csv}),source.eq.user")
        rows = query.order("audio_id").order("start_time").execute().data or []
    except Exception as exc:
        logger.exception("Export: failed to fetch suggestions")
        raise HTTPException(status_code=503, detail="Failed to export") from exc

    file_suffix = "-labeled" if status else ""

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
                "source": r.get("source", "ai"),
                "createdBy": r.get("created_by"),
                "description": r.get("description", ""),
            }
            for r in rows
        ]
        content = json_module.dumps(export_data, indent=2, ensure_ascii=False)
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="labels-{session_id}{file_suffix}.json"'},
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "session_id",
            "audio_id",
            "filename",
            "label",
            "confidence",
            "start_time",
            "end_time",
            "freq_low",
            "freq_high",
            "status",
            "source",
            "created_by",
            "description",
        ]
    )
    for r in rows:
        writer.writerow(
            [
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
                r.get("source", "ai"),
                r.get("created_by", ""),
                r.get("description", ""),
            ]
        )

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="labels-{session_id}{file_suffix}.csv"'},
    )


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
        source=s.get("source", "ai"),
        created_by=s.get("created_by"),
    )


_POINTS_CONFIRM = 10
_POINTS_CORRECT = 20


def _update_user_score(status: SuggestionStatusValue, user_id: str) -> None:
    """Update sst_users score when a suggestion status changes (non-fatal)."""
    if status not in (SuggestionStatusValue.confirmed, SuggestionStatusValue.corrected):
        return

    points = _POINTS_CONFIRM if status == SuggestionStatusValue.confirmed else _POINTS_CORRECT

    try:
        user_res = (
            supabase.table("sst_users")
            .select("today_score, all_time_score")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = getattr(user_res, "data", None) or []
        if not rows:
            logger.warning("Score update: user %s not found", user_id)
            return

        current = rows[0]
        new_today = current["today_score"] + points
        new_all_time = current["all_time_score"] + points

        (
            supabase.table("sst_users")
            .update({"today_score": new_today, "all_time_score": new_all_time})
            .eq("id", user_id)
            .execute()
        )

        logger.info(
            "score_update user=%s status=%s points=+%d today=%d all_time=%d",
            user_id,
            status.value,
            points,
            new_today,
            new_all_time,
        )
    except Exception:
        logger.exception("Failed to update user score (non-fatal)")
