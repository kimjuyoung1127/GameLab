from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SuggestionDraft:
    label: str
    confidence: int
    description: str
    start_time: float
    end_time: float
    freq_low: int
    freq_high: int


class AnalysisEngine(ABC):
    @abstractmethod
    async def analyze(self, file_path: str, config: dict | None = None) -> list[SuggestionDraft]:
        ...
