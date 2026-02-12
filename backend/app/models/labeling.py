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
    freq_low: int
    freq_high: int
    status: str


class UpdateSuggestionRequest(CamelModel):
    status: SuggestionStatusValue
