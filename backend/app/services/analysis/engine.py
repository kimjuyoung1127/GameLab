"""분석 엔진 ABC 인터페이스 및 SuggestionDraft 출력 타입 정의."""
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
    band_type: str = ""
    metadata: dict | None = None


class AnalysisEngine(ABC):
    @abstractmethod
    async def analyze(self, file_path: str, config: dict | None = None) -> list[SuggestionDraft]:
        ...
