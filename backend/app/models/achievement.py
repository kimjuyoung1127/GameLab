"""Achievement models for sst_achievements and sst_user_achievements."""
from datetime import datetime

from pydantic import BaseModel


class Achievement(BaseModel):
    id: str
    name: str
    name_ko: str
    description: str
    description_ko: str
    icon: str = "trophy"
    category: str = "general"
    threshold: int = 1
    sort_order: int = 0
    created_at: datetime | None = None


class UserAchievement(BaseModel):
    id: str
    user_id: str
    achievement_id: str
    unlocked_at: datetime | None = None


class UnlockRequest(BaseModel):
    achievement_id: str
