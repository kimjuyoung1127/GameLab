from app.models.jobs import JobStatusResponse
from app.models.upload import UploadJobStatus

# In-memory job store (replace with DB in production)
_jobs: dict[str, JobStatusResponse] = {}


def register_job(
    job_id: str,
    status: UploadJobStatus = UploadJobStatus.queued,
    session_id: str | None = None,
    file_count: int | None = None,
):
    _jobs[job_id] = JobStatusResponse(
        job_id=job_id,
        status=status,
        session_id=session_id,
        file_count=file_count,
    )


def set_job_status(
    job_id: str,
    *,
    status: UploadJobStatus,
    progress: float | None = None,
    error: str | None = None,
    session_id: str | None = None,
    file_count: int | None = None,
):
    current = _jobs.get(job_id)
    if not current:
        return

    _jobs[job_id] = JobStatusResponse(
        job_id=job_id,
        status=status,
        progress=current.progress if progress is None else progress,
        session_id=current.session_id if session_id is None else session_id,
        file_count=current.file_count if file_count is None else file_count,
        error=error,
    )


def get_job(job_id: str) -> JobStatusResponse | None:
    return _jobs.get(job_id)
