"""라벨링 도메인 모델: SuggestionResponse, UpdateSuggestionRequest, 상태 열거형."""
from __future__ import annotations

from enum import Enum

from pydantic import model_validator

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
    source: str = "ai"
    created_by: str | None = None


class UpdateSuggestionRequest(CamelModel):
    status: SuggestionStatusValue | None = None
    label: str | None = None
    description: str | None = None
    start_time: float | None = None
    end_time: float | None = None
    freq_low: float | None = None
    freq_high: float | None = None

    @model_validator(mode="after")
    def _at_least_one_field(self) -> UpdateSuggestionRequest:
        fields = [self.status, self.label, self.description,
                  self.start_time, self.end_time, self.freq_low, self.freq_high]
        if all(v is None for v in fields):
            raise ValueError("At least one field must be provided")
        if self.start_time is not None and self.end_time is not None:
            if self.start_time >= self.end_time:
                raise ValueError("start_time must be less than end_time")
        if self.freq_low is not None and self.freq_high is not None:
            if self.freq_low >= self.freq_high:
                raise ValueError("freq_low must be less than freq_high")
        return self


class CreateSuggestionInput(CamelModel):
    audio_id: str
    label: str
    start_time: float
    end_time: float
    freq_low: float
    freq_high: float
    description: str = ""
    confidence: int = 100


class CreateSuggestionsRequest(CamelModel):
    suggestions: list[CreateSuggestionInput]
