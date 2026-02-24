"""Leaderboard API: ranking and authenticated user's score."""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import CurrentUser, ensure_sst_user_exists, get_current_user
from app.core.supabase_client import supabase
from app.models.leaderboard import LeaderboardEntry

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


@router.get("/me", response_model=LeaderboardEntry)
async def get_my_score(current_user: CurrentUser = Depends(get_current_user)):
    """Get current authenticated user's score."""
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")

    try:
        res = (
            supabase.table("sst_users")
            .select("*")
            .eq("id", current_user.id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to fetch user score", extra={"user_id": current_user.id})
        raise HTTPException(status_code=503, detail="Failed to load user score") from exc

    rows = getattr(res, "data", None) or []
    if not rows:
        raise HTTPException(status_code=404, detail="User not found")

    return _row_to_entry(rows[0])


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
