"""분석 엔진 레지스트리: 이름으로 엔진 클래스를 조회하는 팩토리."""
from app.services.analysis.engine import AnalysisEngine
from app.services.analysis.soundlab_v57 import SoundLabV57Engine
from app.services.analysis.rule_fallback import RuleFallbackEngine

_ENGINES: dict[str, type[AnalysisEngine]] = {
    "soundlab_v57": SoundLabV57Engine,
    "rule_fallback": RuleFallbackEngine,
}


def get_engine(name: str) -> AnalysisEngine:
    cls = _ENGINES.get(name)
    if not cls:
        raise ValueError(f"Unknown analysis engine: {name}. Available: {list(_ENGINES.keys())}")
    return cls()
