"""리더보드 API: 사용자 랭킹 및 점수 조회."""
import logging
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.leaderboard import LeaderboardEntry
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
    return [_row_to_entry(r) for r in rows]


def _row_to_entry(r: dict) -> LeaderboardEntry:
    return LeaderboardEntry(
        id=r["id"],
        name=r["name"],
        email=r["email"],
        role=r["role"],
        avatar=r.get("avatar"),
        today_score=r["today_score"],
        accuracy=float(r["accuracy"]),
        all_time_score=r["all_time_score"],
    )


_DEFAULT_USER_ID = "u-1"


@router.get("/me", response_model=LeaderboardEntry)
async def get_my_score():
    """Get current user's score (uses demo user until auth is fully integrated)."""
    try:
        res = (
            supabase.table("sst_users")
            .select("*")
            .eq("id", _DEFAULT_USER_ID)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to fetch user score")
        raise HTTPException(status_code=503, detail="Failed to load user score") from exc

    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")

    return _row_to_entry(res.data)
