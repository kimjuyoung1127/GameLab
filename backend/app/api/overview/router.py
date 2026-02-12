import logging
from fastapi import APIRouter, HTTPException
from app.models.overview import OverviewMetrics
from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/overview", tags=["overview"])
logger = logging.getLogger(__name__)


@router.get("/metrics", response_model=OverviewMetrics)
async def get_overview_metrics():
    try:
        res = supabase.table("sst_sessions").select("*").execute()
        sessions = res.data or []
    except Exception as exc:
        logger.exception("Failed to fetch overview metrics")
        raise HTTPException(status_code=503, detail="Failed to load overview metrics") from exc

    total_sessions = len(sessions)
    total_files = sum(s.get("file_count", 0) for s in sessions)

    completed = [s for s in sessions if s.get("status") == "completed"]
    processing = [s for s in sessions if s.get("status") == "processing"]
    files_processed = sum(s.get("file_count", 0) for s in completed)

    scores = [s["score"] for s in completed if s.get("score") is not None]
    avg_accuracy = sum(scores) / len(scores) if scores else 0.0

    return OverviewMetrics(
        total_sessions=total_sessions,
        total_files=total_files,
        files_processed=files_processed,
        avg_accuracy=round(avg_accuracy, 1),
        recent_uploads=total_files,
        active_sessions=len(processing),
    )
