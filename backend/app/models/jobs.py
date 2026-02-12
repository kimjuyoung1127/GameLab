from typing import Optional
from app.models.common import CamelModel
from app.models.upload import UploadJobStatus


class JobStatusResponse(CamelModel):
    job_id: str
    status: UploadJobStatus
    progress: float = 0
    session_id: Optional[str] = None
    file_count: Optional[int] = None
    error: Optional[str] = None
