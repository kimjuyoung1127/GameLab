"""Leaderboard API: ranking and authenticated user's score."""
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import CurrentUser, ensure_sst_user_exists, get_current_user
from app.core.supabase_client import supabase
from app.models.leaderboard import LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(scope: str = Query("daily", pattern="^(daily|weekly|all_time)$")):
    try:
        if scope == "all_time":
            res = (
                supabase.table("sst_users")
                .select("*")
                .order("all_time_score", desc=True)
                .execute()
            )
            rows = res.data or []
        elif scope == "weekly":
            users_res = supabase.table("sst_users").select("*").execute()
            users = users_res.data or []
            since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            ev_res = (
                supabase.table("sst_reward_events")
                .select("user_id,points")
                .gte("occurred_at", since)
                .execute()
            )
            weekly_points: dict[str, int] = defaultdict(int)
            for event in (ev_res.data or []):
                uid = event.get("user_id")
                if uid:
                    weekly_points[uid] += int(event.get("points", 0))
            for user in users:
                user["today_score"] = weekly_points.get(user.get("id"), 0)
            rows = sorted(users, key=lambda x: int(x.get("today_score", 0)), reverse=True)
        else:
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
async def get_my_score(
    scope: str = Query("daily", pattern="^(daily|weekly|all_time)$"),
    current_user: CurrentUser = Depends(get_current_user),
):
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

    row = rows[0]
    if scope == "all_time":
        row["today_score"] = int(row.get("all_time_score", 0))
    elif scope == "weekly":
        since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        ev_res = (
            supabase.table("sst_reward_events")
            .select("points")
            .eq("user_id", current_user.id)
            .gte("occurred_at", since)
            .execute()
        )
        row["today_score"] = sum(int(x.get("points", 0)) for x in (ev_res.data or []))

    return _row_to_entry(row)


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
