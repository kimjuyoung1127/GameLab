"""잡 상태 API: 업로드/분석 진행 상태 폴링 엔드포인트."""
from fastapi import APIRouter, HTTPException
from app.models.jobs import JobStatusResponse
from app.services.job_manager import get_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
