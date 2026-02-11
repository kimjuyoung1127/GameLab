import logging
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import LeaderboardEntry
from app.core.supabase_client import supabase

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard():
    try:
        res = (
            supabase.table("sst_users")
            .select("*")
            .order("today_score", desc=True)
            .execute()
        )
        rows = res.data or []
    except Exception as exc:
        logger.exception("Failed to fetch leaderboard")
        raise HTTPException(status_code=503, detail="Failed to load leaderboard") from exc
    return [
        LeaderboardEntry(
            id=r["id"],
            name=r["name"],
            email=r["email"],
            role=r["role"],
            avatar=r.get("avatar"),
            today_score=r["today_score"],
            accuracy=float(r["accuracy"]),
            all_time_score=r["all_time_score"],
        )
        for r in rows
    ]
