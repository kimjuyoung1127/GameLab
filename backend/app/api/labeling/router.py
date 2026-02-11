import logging
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import SuggestionResponse
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

    return [
        SuggestionResponse(
            id=s.get("id", ""),
            audio_id=s.get("audio_id", ""),
            label=s.get("label", "Suggestion"),
            confidence=int(s.get("confidence", 0)),
            description=s.get("description", ""),
            start_time=float(s.get("start_time", 0)),
            end_time=float(s.get("end_time", 0)),
            freq_low=int(s.get("freq_low", 0)),
            freq_high=int(s.get("freq_high", 0)),
            status=s.get("status", "pending"),
        )
        for s in rows
    ]
