"""업로드 도메인 모델: UploadJobStatus 열거형, UploadResult 응답."""
from typing import Optional
from enum import Enum
from app.models.common import CamelModel


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
