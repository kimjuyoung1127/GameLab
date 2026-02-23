"""대시보드 개요 도메인 모델: OverviewMetrics."""
from app.models.common import CamelModel


class OverviewMetrics(CamelModel):
    total_sessions: int
    total_files: int
    files_processed: int
    avg_accuracy: float
    recent_uploads: int
    active_sessions: int
