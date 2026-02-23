"""세션 도메인 모델: SessionResponse, AudioFileResponse."""
from typing import Optional
from app.models.common import CamelModel


class SessionResponse(CamelModel):
    id: str
    name: str
    device_type: str
    status: str
    file_count: int
    progress: int
    score: Optional[float] = None
    created_at: str


class AudioFileResponse(CamelModel):
    id: str
    session_id: str
    filename: str
    duration: str
    sample_rate: str
    status: str
    audio_url: Optional[str] = None
