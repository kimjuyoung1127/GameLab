"""Pipeline Step Registry.

JSON config의 "steps" 배열에 있는 이름으로 파이프라인을 자동 조립한다.

새 스텝 추가 방법:
1. steps/ 디렉토리에 새 파일 생성 (PipelineStep 상속)
2. STEP_REGISTRY에 등록
3. JSON config "steps" 배열에 이름 추가
"""
from app.services.analysis.pipeline import AnalysisPipeline, PipelineStep

from .load_audio import LoadAudioStep
from .feature_extraction import FeatureExtractionStep
from .threshold import OtsuThresholdStep
from .state_machine import StateMachineStep
from .gap_fill import GapFillStep
from .trim import TrimStep
from .noise_removal import NoiseRemovalStep

STEP_REGISTRY: dict[str, type[PipelineStep]] = {
    "load_audio": LoadAudioStep,
    "feature_extraction": FeatureExtractionStep,
    "threshold": OtsuThresholdStep,
    "state_machine": StateMachineStep,
    "gap_fill": GapFillStep,
    "trim": TrimStep,
    "noise_removal": NoiseRemovalStep,
}


def build_pipeline(config: dict) -> AnalysisPipeline:
    """JSON config의 steps 배열로 파이프라인 자동 조립."""
    step_names = config.get("steps", [])
    steps: list[PipelineStep] = []
    for name in step_names:
        cls = STEP_REGISTRY.get(name)
        if cls is None:
            available = list(STEP_REGISTRY.keys())
            raise ValueError(
                f"Unknown pipeline step: {name!r}. Available: {available}"
            )
        steps.append(cls())
    return AnalysisPipeline(steps)
