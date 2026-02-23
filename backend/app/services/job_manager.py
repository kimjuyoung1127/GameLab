"""잡 스토어: Supabase DB 기반 잡 등록, 상태 변경, 조회."""
import logging
from datetime import datetime, timezone

from app.core.supabase_client import supabase
from app.models.jobs import JobStatusResponse
from app.models.upload import UploadJobStatus

logger = logging.getLogger(__name__)


def register_job(
    job_id: str,
    status: UploadJobStatus = UploadJobStatus.queued,
    session_id: str | None = None,
    file_count: int | None = None,
):
    now_iso = datetime.now(timezone.utc).isoformat()
    row: dict = {
        "id": job_id,
        "status": status.value,
        "progress": 0,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    if session_id is not None:
        row["session_id"] = session_id
    if file_count is not None:
        row["file_count"] = file_count

    try:
        supabase.table("sst_jobs").insert(row).execute()
    except Exception:
        # Common during upload bootstrap: session row may not exist yet.
        # Retry once without session_id so polling can still find the job row.
        logger.exception("Failed to register job %s", job_id)
        if "session_id" in row:
            try:
                fallback_row = {k: v for k, v in row.items() if k != "session_id"}
                supabase.table("sst_jobs").insert(fallback_row).execute()
                logger.warning(
                    "Registered job %s without session_id due to FK timing; session_id will be patched later",
                    job_id,
                )
            except Exception:
                logger.exception("Fallback register without session_id also failed for job %s", job_id)


def set_job_status(
    job_id: str,
    *,
    status: UploadJobStatus,
    progress: float | None = None,
    error: str | None = None,
    session_id: str | None = None,
    file_count: int | None = None,
):
    update: dict = {
        "status": status.value,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if progress is not None:
        update["progress"] = progress
    if error is not None:
        update["error"] = error
    if session_id is not None:
        update["session_id"] = session_id
    if file_count is not None:
        update["file_count"] = file_count

    try:
        supabase.table("sst_jobs").update(update).eq("id", job_id).execute()
    except Exception:
        logger.exception("Failed to update job %s", job_id)


def get_job(job_id: str) -> JobStatusResponse | None:
    try:
        # Avoid maybe_single() 406/None edge-cases by querying as list.
        res = (
            supabase.table("sst_jobs")
            .select("*")
            .eq("id", job_id)
            .limit(1)
            .execute()
        )
        rows = getattr(res, "data", None) or []
        if not rows:
            return None
        d = rows[0]
        return JobStatusResponse(
            job_id=d["id"],
            status=UploadJobStatus(d["status"]),
            progress=d.get("progress", 0),
            session_id=d.get("session_id"),
            file_count=d.get("file_count"),
            error=d.get("error"),
        )
    except Exception:
        logger.exception("Failed to get job %s", job_id)
        return None
