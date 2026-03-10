"""SuggestionAssistService — LLM 기반 suggestion 재판정 오케스트레이터.

흐름: suggestion 조회 → 오디오 메타 조회 → 클립 추출(선택) → 프롬프트 빌드 → LLM 호출 → DB 저장.
"""
from __future__ import annotations

import asyncio
import logging
import time
import uuid

from app.core.config import settings
from app.core.supabase_client import supabase
from app.models.llm_assist import LlmAssistResponse, LlmInputMode, LlmRecommendedAction
from app.services.llm_assist.clip_extractor import extract_clip
from app.services.llm_assist.prompt_builder import (
    SYSTEM_INSTRUCTION,
    build_audio_clip_prompt,
    build_text_features_prompt,
)
from app.services.llm_assist.provider import GeminiProvider

logger = logging.getLogger(__name__)


class SuggestionAssistService:
    """Suggestion LLM assist 서비스. provider 주입으로 테스트 가능."""

    def __init__(self, provider: GeminiProvider | None = None) -> None:
        self._provider = provider or GeminiProvider()
        self._timeout_sec = settings.llm_timeout_sec

    async def assist(
        self,
        suggestion_id: str,
        input_mode: LlmInputMode = LlmInputMode.audio_clip,
    ) -> LlmAssistResponse:
        """suggestion 1건에 대한 LLM assist를 생성하고 DB에 저장."""
        start = time.monotonic()
        audio_bytes: bytes | None = None
        clip_start: float | None = None
        clip_end: float | None = None

        # 1) suggestion 조회
        sug_resp = await asyncio.to_thread(
            lambda: supabase.table("sst_suggestions")
            .select("*")
            .eq("id", suggestion_id)
            .single()
            .execute()
        )
        suggestion = sug_resp.data
        if not suggestion:
            raise ValueError(f"Suggestion {suggestion_id} not found")

        # 2) audio_file 메타 조회
        audio_id = suggestion["audio_id"]
        audio_resp = await asyncio.to_thread(
            lambda: supabase.table("sst_audio_files")
            .select("*")
            .eq("id", audio_id)
            .single()
            .execute()
        )
        audio_file = audio_resp.data
        if not audio_file:
            raise ValueError(f"Audio file not found for suggestion {suggestion_id}")

        # DB text -> numeric conversion
        def _to_float(val, default=0.0):
            try:
                return float(val)
            except (ValueError, TypeError):
                return default

        audio_meta = {
            "sample_rate": _to_float(audio_file.get("sample_rate", 0)),
            "duration": _to_float(audio_file.get("duration", 0)),
        }

        # 3) 오디오 클립 추출 (audio_clip 모드)
        actual_mode = input_mode
        if input_mode == LlmInputMode.audio_clip and settings.llm_audio_mode:
            try:
                audio_bytes, clip_start, clip_end = await extract_clip(
                    audio_file,
                    suggestion["start_time"],
                    suggestion["end_time"],
                )
            except Exception:
                logger.warning(
                    "clip extraction failed for suggestion=%s, falling back to text_features",
                    suggestion_id,
                    exc_info=True,
                )
                actual_mode = LlmInputMode.text_features
                audio_bytes = None
        elif input_mode == LlmInputMode.audio_clip and not settings.llm_audio_mode:
            actual_mode = LlmInputMode.text_features

        # 4) 프롬프트 빌드
        if actual_mode == LlmInputMode.audio_clip and audio_bytes:
            prompt = build_audio_clip_prompt(suggestion, audio_meta)
        else:
            prompt = build_text_features_prompt(suggestion, audio_meta)
            actual_mode = LlmInputMode.text_features

        # 5) LLM 호출 (timeout)
        try:
            llm_result = await asyncio.wait_for(
                self._provider.generate(
                    prompt=prompt,
                    system_instruction=SYSTEM_INSTRUCTION,
                    audio_bytes=audio_bytes,
                ),
                timeout=self._timeout_sec,
            )
        except asyncio.TimeoutError:
            elapsed_ms = round((time.monotonic() - start) * 1000)
            logger.error(
                "LLM assist TIMEOUT suggestion=%s after %dms",
                suggestion_id, elapsed_ms,
            )
            raise
        except Exception:
            elapsed_ms = round((time.monotonic() - start) * 1000)
            logger.exception(
                "LLM assist FAILED suggestion=%s after %dms",
                suggestion_id, elapsed_ms,
            )
            raise

        elapsed_ms = round((time.monotonic() - start) * 1000)

        # 6) DB 저장
        review_id = f"llmr-{uuid.uuid4().hex[:8]}"
        row = {
            "id": review_id,
            "suggestion_id": suggestion_id,
            "provider": settings.llm_provider,
            "model": settings.llm_model,
            "input_mode": actual_mode.value,
            "recommended_action": llm_result["recommended_action"],
            "suggested_label": llm_result.get("suggested_label"),
            "llm_confidence": int(llm_result["llm_confidence"]),
            "explanation": llm_result.get("explanation", ""),
            "clip_start_time": clip_start,
            "clip_end_time": clip_end,
            "latency_ms": elapsed_ms,
        }

        await asyncio.to_thread(
            lambda: supabase.table("sst_suggestion_llm_reviews").insert(row).execute()
        )

        logger.info(
            "llm_assist suggestion=%s mode=%s action=%s confidence=%d latency_ms=%d",
            suggestion_id,
            actual_mode.value,
            llm_result["recommended_action"],
            int(llm_result["llm_confidence"]),
            elapsed_ms,
        )

        # 7) 응답 반환
        return LlmAssistResponse(
            id=review_id,
            suggestion_id=suggestion_id,
            provider=settings.llm_provider,
            model=settings.llm_model,
            input_mode=actual_mode,
            recommended_action=llm_result["recommended_action"],
            suggested_label=llm_result.get("suggested_label"),
            llm_confidence=int(llm_result["llm_confidence"]),
            explanation=llm_result.get("explanation", ""),
            clip_start_time=clip_start,
            clip_end_time=clip_end,
            created_at=row.get("created_at", ""),
            latency_ms=elapsed_ms,
        )
    async def batch_assist(
        self,
        suggestion_ids: list[str],
        input_mode: LlmInputMode = LlmInputMode.audio_clip,
    ) -> tuple[list[LlmAssistResponse], list[dict]]:
        """복수 suggestion에 대한 LLM assist를 병렬 처리. 캐시 히트는 즉시 반환."""
        results: list[LlmAssistResponse] = []
        errors: list[dict] = []

        if not suggestion_ids:
            return results, errors

        # 1) 이미 캐시된 결과 조회
        ids_copy = list(suggestion_ids)
        cached_resp = await asyncio.to_thread(
            lambda: supabase.table("sst_suggestion_llm_reviews")
            .select("*")
            .in_("suggestion_id", ids_copy)
            .order("created_at", desc=True)
            .execute()
        )

        # suggestion_id별 최신 1건만
        cached_map: dict[str, dict] = {}
        for row in (cached_resp.data or []):
            sid = row["suggestion_id"]
            if sid not in cached_map:
                cached_map[sid] = row

        # 캐시 히트 → 즉시 results에 추가
        for sid, row in cached_map.items():
            def _to_float(val, default=0.0):
                try:
                    return float(val) if val is not None else default
                except (ValueError, TypeError):
                    return default

            results.append(LlmAssistResponse(
                id=row["id"],
                suggestion_id=sid,
                provider=row.get("provider", "google"),
                model=row.get("model", ""),
                input_mode=LlmInputMode(row.get("input_mode", "text_features")),
                recommended_action=LlmRecommendedAction(row["recommended_action"]),
                suggested_label=row.get("suggested_label"),
                llm_confidence=int(row.get("llm_confidence", 0)),
                explanation=row.get("explanation", ""),
                clip_start_time=_to_float(row.get("clip_start_time")),
                clip_end_time=_to_float(row.get("clip_end_time")),
                created_at=str(row.get("created_at", "")),
                latency_ms=int(row.get("latency_ms", 0)),
            ))

        # 2) 미캐시 ID에 대해 병렬 호출
        uncached_ids = [sid for sid in suggestion_ids if sid not in cached_map]
        if not uncached_ids:
            return results, errors

        sem = asyncio.Semaphore(settings.llm_batch_concurrency)

        async def _run(sid: str) -> LlmAssistResponse:
            async with sem:
                return await self.assist(sid, input_mode)

        tasks = [_run(sid) for sid in uncached_ids]
        outcomes = await asyncio.gather(*tasks, return_exceptions=True)

        for sid, outcome in zip(uncached_ids, outcomes):
            if isinstance(outcome, Exception):
                errors.append({"suggestion_id": sid, "error": str(outcome)})
                logger.warning("batch_assist failed for suggestion=%s: %s", sid, outcome)
            else:
                results.append(outcome)

        logger.info(
            "batch_assist total=%d cached=%d new=%d errors=%d",
            len(suggestion_ids), len(cached_map), len(results) - len(cached_map), len(errors),
        )
        return results, errors
