"""라벨링 도메인 모델: SuggestionResponse, UpdateSuggestionRequest, 상태 열거형."""
from enum import Enum
from app.models.common import CamelModel


class SuggestionStatusValue(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    corrected = "corrected"


class SuggestionResponse(CamelModel):
    id: str
    audio_id: str
    label: str
    confidence: int
    description: str
    start_time: float
    end_time: float
    freq_low: float
    freq_high: float
    status: SuggestionStatusValue


class UpdateSuggestionRequest(CamelModel):
    status: SuggestionStatusValue
