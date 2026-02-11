from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class CamelModel(BaseModel):
    """Base model that serializes to camelCase JSON."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class UploadJobStatus(str, Enum):
    idle = "idle"
    uploading = "uploading"
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"


class UploadResult(CamelModel):
    file_id: str
    filename: str
    status: UploadJobStatus
    job_id: Optional[str] = None
    session_id: Optional[str] = None
    progress: float = 0
    error: Optional[str] = None


class JobStatusResponse(CamelModel):
    job_id: str
    status: UploadJobStatus
    progress: float = 0
    session_id: Optional[str] = None
    file_count: Optional[int] = None
    error: Optional[str] = None


class OverviewMetrics(CamelModel):
    total_sessions: int
    total_files: int
    files_processed: int
    avg_accuracy: float
    recent_uploads: int
    active_sessions: int


class SessionResponse(CamelModel):
    id: str
    name: str
    device_type: str
    status: str
    file_count: int
    progress: int
    score: Optional[float] = None
    created_at: str


class LeaderboardEntry(CamelModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    today_score: int
    accuracy: float
    all_time_score: int


class AudioFileResponse(CamelModel):
    id: str
    session_id: str
    filename: str
    duration: str
    sample_rate: str
    status: str
    audio_url: Optional[str] = None


class SuggestionResponse(CamelModel):
    id: str
    audio_id: str
    label: str
    confidence: int
    description: str
    start_time: float
    end_time: float
    freq_low: int
    freq_high: int
    status: str
