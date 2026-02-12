import logging
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.sessions import SessionResponse, AudioFileResponse
from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[SessionResponse])
async def list_sessions():
    try:
        res = (
            supabase.table("sst_sessions")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        rows = res.data or []
    except Exception as exc:
        logger.exception("Failed to fetch sessions")
        raise HTTPException(status_code=503, detail="Failed to load sessions") from exc

    return [
        SessionResponse(
            id=r.get("id", ""),
            name=r.get("name", "Untitled Session"),
            device_type=r.get("device_type", "Unknown"),
            status=r.get("status", "pending"),
            file_count=r.get("file_count", 0),
            progress=r.get("progress", 0),
            score=r.get("score"),
            created_at=r.get("created_at", ""),
        )
        for r in rows
    ]


@router.get("/{session_id}/files", response_model=List[AudioFileResponse])
async def get_session_files(session_id: str):
    try:
        res = (
            supabase.table("sst_audio_files")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=True)
            .execute()
        )
        rows = res.data or []
    except Exception as exc:
        logger.exception("Failed to fetch session files", extra={"session_id": session_id})
        raise HTTPException(status_code=503, detail="Failed to load session files") from exc

    return [
        AudioFileResponse(
            id=r.get("id", ""),
            session_id=r.get("session_id", ""),
            filename=r.get("filename", "unknown"),
            duration=r.get("duration", "00:00:00"),
            sample_rate=r.get("sample_rate", "Unknown"),
            status=r.get("status", "pending"),
            audio_url=r.get("audio_url"),
        )
        for r in rows
    ]
