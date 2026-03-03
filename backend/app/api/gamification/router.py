"""Gamification API: snapshot, mission progress, and claim reward."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import CurrentUser, ensure_sst_user_exists, get_current_user
from app.models.gamification import (
    ClaimMissionResponse,
    GamificationSnapshotResponse,
    MissionsResponse,
)
from app.services.gamification.service import (
    build_gamification_snapshot,
    claim_mission_reward,
    get_missions,
)

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


@router.get("/me", response_model=GamificationSnapshotResponse)
async def get_my_gamification(current_user: CurrentUser = Depends(get_current_user)):
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")
    return build_gamification_snapshot(current_user.id)


@router.get("/missions", response_model=MissionsResponse)
async def get_my_missions(current_user: CurrentUser = Depends(get_current_user)):
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")
    return get_missions(current_user.id)


@router.post("/missions/{mission_id}/claim", response_model=ClaimMissionResponse)
async def claim_mission(mission_id: str, current_user: CurrentUser = Depends(get_current_user)):
    if not ensure_sst_user_exists(current_user):
        raise HTTPException(status_code=503, detail="Failed to initialize user profile")
    return claim_mission_reward(current_user.id, mission_id)
