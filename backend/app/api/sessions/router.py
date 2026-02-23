"""세션 API: 세션 목록 조회, 파일 조회, 세션 삭제 (cascade)."""
import logging
import os
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.sessions import SessionResponse, AudioFileResponse
from app.core.supabase_client import supabase
from app.core.config import settings

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


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and all associated audio files and suggestions.

    Deletion order (no CASCADE in DB):
    1. Get audio file IDs for the session
    2. Delete suggestions for those audio files
    3. Delete audio files
    4. Delete the session
    5. Remove disk files
    """
    try:
        # Step 0: Verify session exists before deleting
        check_res = (
            supabase.table("sst_sessions")
            .select("id")
            .eq("id", session_id)
            .execute()
        )
        if not (check_res.data or []):
            raise HTTPException(status_code=404, detail="Session not found")

        # Step 1: Get audio file records
        file_res = (
            supabase.table("sst_audio_files")
            .select("id, audio_url")
            .eq("session_id", session_id)
            .execute()
        )
        file_rows = file_res.data or []
        file_ids = [f["id"] for f in file_rows]

        # Step 2: Delete suggestions
        if file_ids:
            supabase.table("sst_suggestions").delete().in_("audio_id", file_ids).execute()

        # Step 3: Delete audio files
        if file_ids:
            supabase.table("sst_audio_files").delete().in_("id", file_ids).execute()

        # Step 4: Delete session
        supabase.table("sst_sessions").delete().eq("id", session_id).execute()

        # Step 5: Remove disk files
        for fr in file_rows:
            audio_url = fr.get("audio_url", "")
            if audio_url and "/uploads/" in audio_url:
                url_path = audio_url.split("/uploads/")[-1]
                if url_path:
                    disk_path = os.path.join(settings.upload_dir, url_path)
                    if os.path.exists(disk_path):
                        try:
                            os.remove(disk_path)
                        except Exception:
                            logger.warning("Failed to remove disk file: %s", disk_path)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete session", extra={"session_id": session_id})
        raise HTTPException(status_code=503, detail="Failed to delete session") from exc

    return {"ok": True, "deletedSessionId": session_id, "deletedFileCount": len(file_ids)}
