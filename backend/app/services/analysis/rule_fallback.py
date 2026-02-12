from app.services.analysis.engine import AnalysisEngine, SuggestionDraft


class RuleFallbackEngine(AnalysisEngine):
    async def analyze(self, file_path: str, config: dict | None = None) -> list[SuggestionDraft]:
        return [
            SuggestionDraft(
                label="Rule-based anomaly candidate",
                confidence=50,
                description="Generic rule-based fallback suggestion.",
                start_time=5.0,
                end_time=15.0,
                freq_low=800,
                freq_high=4000,
            )
        ]
