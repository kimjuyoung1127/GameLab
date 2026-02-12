from app.core.config import settings
from app.services.analysis.registry import get_engine
from app.services.analysis.engine import SuggestionDraft


class AnalysisService:
    def __init__(self):
        self._engine = get_engine(settings.analysis_engine)

    async def analyze(self, file_path: str, config: dict | None = None) -> list[SuggestionDraft]:
        return await self._engine.analyze(file_path, config)
