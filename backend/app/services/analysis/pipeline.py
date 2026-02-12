"""
Analysis Pipeline Framework (Sprint 12.3)

파이프라인 스텝 조합 패턴:
- AnalysisContext: 스텝 간 공유되는 분석 상태
- PipelineStep: 각 분석 스텝의 베이스 클래스
- AnalysisPipeline: 스텝을 순서대로 실행하는 파이프라인
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class AnalysisContext:
    """파이프라인 스텝 간 공유되는 분석 상태."""

    file_path: str
    config: dict

    # LoadAudioStep이 채움
    sample_rate: int = 0
    signal: np.ndarray | None = None

    # FeatureExtractionStep이 채움
    chunks: list[dict] = field(default_factory=list)
    energies: dict[str, list[float]] = field(default_factory=dict)

    # ThresholdStep이 채움
    thresholds: dict[str, float] = field(default_factory=dict)

    # 엔진 메타데이터 (로깅/디버깅용)
    metadata: dict[str, Any] = field(default_factory=dict)


class PipelineStep(ABC):
    """각 분석 스텝의 베이스 클래스.

    execute()를 구현하여 ctx를 변환하고 반환한다.
    JSON config 파라미터는 ctx.config에서 읽는다.
    """

    @abstractmethod
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        ...


class AnalysisPipeline:
    """스텝을 순서대로 실행하는 파이프라인."""

    def __init__(self, steps: list[PipelineStep]):
        self._steps = steps

    def run(self, file_path: str, config: dict) -> AnalysisContext:
        ctx = AnalysisContext(file_path=file_path, config=config)
        for step in self._steps:
            step_name = type(step).__name__
            logger.debug("pipeline step=%s start", step_name)
            ctx = step.execute(ctx)
            logger.debug("pipeline step=%s done", step_name)
        return ctx
