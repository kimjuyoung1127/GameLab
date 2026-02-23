"""Achievement endpoints: list all, current user achievements, unlock."""
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import CurrentUser, ensure_sst_user_exists, get_current_user
from app.core.supabase_client import supabase
from app.models.achievement import Achievement, UnlockRequest, UserAchievement

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("", response_model=list[Achievement])
async def list_achievements():
    """Return all achievement definitions, ordered by sort_order."""
    res = supabase.table("sst_achievements").select("*").order("sort_order").execute()
    return res.data


@router.get("/me", response_model=list[UserAchievement])
async def get_my_achievements(current_user: CurrentUser = Depends(get_current_user)):
    """Return achievements unlocked by the authenticated user."""
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")
    res = (
        supabase.table("sst_user_achievements")
        .select("*")
        .eq("user_id", current_user.id)
        .execute()
    )
    return res.data


@router.post("/unlock", response_model=UserAchievement)
async def unlock_achievement(
    body: UnlockRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Unlock an achievement for the authenticated user (idempotent upsert)."""
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")

    ach = supabase.table("sst_achievements").select("id").eq("id", body.achievement_id).execute()
    if not ach.data:
        raise HTTPException(status_code=404, detail=f"Achievement '{body.achievement_id}' not found")

    try:
        res = (
            supabase.table("sst_user_achievements")
            .upsert(
                {"user_id": current_user.id, "achievement_id": body.achievement_id},
                on_conflict="user_id,achievement_id",
            )
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Failed to unlock achievement") from exc

    if res.data:
        return res.data[0]

    existing = (
        supabase.table("sst_user_achievements")
        .select("*")
        .eq("user_id", current_user.id)
        .eq("achievement_id", body.achievement_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]
    raise HTTPException(status_code=503, detail="Failed to read unlocked achievement")
