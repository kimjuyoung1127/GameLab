"""AnalysisService — timeout, fallback, structured logging.

엔진 실행을 래핑하여:
- 타임아웃 시 자동 fallback
- 예외 시 자동 fallback
- 구조화 로깅 (엔진명, 파일, 소요시간, suggestion 수)
"""
from __future__ import annotations

import asyncio
import logging
import time

from app.core.config import settings
from app.services.analysis.engine import SuggestionDraft
from app.services.analysis.registry import get_engine

logger = logging.getLogger(__name__)

_FALLBACK_ENGINE = "rule_fallback"


class AnalysisService:
    def __init__(self) -> None:
        self._engine_name = settings.analysis_engine
        self._engine = get_engine(self._engine_name)
        self._timeout_sec = settings.analysis_timeout_sec

    async def analyze(
        self, file_path: str, config: dict | None = None
    ) -> list[SuggestionDraft]:
        start = time.monotonic()

        try:
            drafts = await asyncio.wait_for(
                self._engine.analyze(file_path, config),
                timeout=self._timeout_sec,
            )
            elapsed_ms = round((time.monotonic() - start) * 1000)

            logger.info(
                "engine=%s file=%s duration_ms=%d suggestions=%d",
                self._engine_name, file_path, elapsed_ms, len(drafts),
            )
            return drafts

        except asyncio.TimeoutError:
            elapsed_ms = round((time.monotonic() - start) * 1000)
            logger.warning(
                "engine=%s file=%s TIMEOUT after %dms, falling back to %s",
                self._engine_name, file_path, elapsed_ms, _FALLBACK_ENGINE,
            )
            return await self._run_fallback(file_path, config)

        except Exception:
            elapsed_ms = round((time.monotonic() - start) * 1000)
            logger.exception(
                "engine=%s file=%s FAILED after %dms, falling back to %s",
                self._engine_name, file_path, elapsed_ms, _FALLBACK_ENGINE,
            )
            return await self._run_fallback(file_path, config)

    async def _run_fallback(
        self, file_path: str, config: dict | None = None
    ) -> list[SuggestionDraft]:
        if self._engine_name == _FALLBACK_ENGINE:
            logger.error("fallback engine is the primary engine; returning empty")
            return []

        try:
            fallback = get_engine(_FALLBACK_ENGINE)
            drafts = await fallback.analyze(file_path, config)
            logger.info(
                "engine=%s file=%s fallback_suggestions=%d",
                _FALLBACK_ENGINE, file_path, len(drafts),
            )
            return drafts
        except Exception:
            logger.exception("fallback engine=%s also failed", _FALLBACK_ENGINE)
            return []
