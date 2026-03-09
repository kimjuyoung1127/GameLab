"""LLM Assist 도메인 모델: 제안 재판정 요청/응답 DTO."""
from __future__ import annotations

from enum import Enum

from app.models.common import CamelModel


class LlmRecommendedAction(str, Enum):
    confirm = "confirm"
    reject = "reject"
    fix = "fix"


class LlmInputMode(str, Enum):
    text_features = "text_features"
    audio_clip = "audio_clip"


class LlmAssistRequest(CamelModel):
    input_mode: LlmInputMode = LlmInputMode.audio_clip


class LlmAssistResponse(CamelModel):
    id: str
    suggestion_id: str
    provider: str
    model: str
    input_mode: LlmInputMode
    recommended_action: LlmRecommendedAction
    suggested_label: str | None = None
    llm_confidence: int
    explanation: str
    clip_start_time: float | None = None
    clip_end_time: float | None = None
    created_at: str
    latency_ms: int


class LlmBatchAssistRequest(CamelModel):
    """배치 LLM assist 요청: 복수 suggestion ID 전송."""
    suggestion_ids: list[str]
    input_mode: LlmInputMode = LlmInputMode.audio_clip


class LlmBatchErrorItem(CamelModel):
    """배치 처리 중 개별 실패 항목."""
    suggestion_id: str
    error: str


class LlmBatchAssistResponse(CamelModel):
    """배치 LLM assist 응답: 성공 결과 + 에러 목록."""
    results: list[LlmAssistResponse]
    errors: list[LlmBatchErrorItem]
