"""Gamification domain response models."""
from __future__ import annotations

from app.models.common import CamelModel


class NextAchievement(CamelModel):
    id: str | None = None
    remaining: int | None = None


class RewardEventResponse(CamelModel):
    id: str
    event_type: str
    ref_type: str | None = None
    ref_id: str | None = None
    points: int
    message: str
    occurred_at: str


class GamificationSnapshotResponse(CamelModel):
    today_score: int
    week_score: int
    all_time_score: int
    streak_days: int
    daily_goal: int
    daily_progress: int
    rank_daily: int | None = None
    rank_weekly: int | None = None
    rank_all_time: int | None = None
    next_achievement: NextAchievement
    recent_events: list[RewardEventResponse]


class MissionReward(CamelModel):
    points: int
    badge: str | None = None


class MissionProgressResponse(CamelModel):
    mission_id: str
    scope: str
    title: str
    description: str
    progress: int
    target: int
    state: str
    reward: MissionReward


class MissionsResponse(CamelModel):
    daily: list[MissionProgressResponse]
    weekly: list[MissionProgressResponse]


class ClaimMissionResponse(CamelModel):
    mission_id: str
    state: str
    claimed_at: str | None = None
    reward_points: int = 0
