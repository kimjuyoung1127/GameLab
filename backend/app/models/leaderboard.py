from typing import Optional
from app.models.common import CamelModel


class LeaderboardEntry(CamelModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    today_score: int
    accuracy: float
    all_time_score: int
