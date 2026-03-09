"""Gemini LLM 프로바이더: google-generativeai SDK 래퍼."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider:
    """Google Gemini API 호출 래퍼. 동기 SDK를 asyncio.to_thread로 래핑."""

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str | None = None,
    ) -> None:
        self._api_key = api_key or settings.google_api_key
        self._model_name = model_name or settings.llm_model

        if not self._api_key:
            raise ValueError("GOOGLE_API_KEY is not configured")

    async def generate(
        self,
        prompt: str,
        system_instruction: str = "",
        audio_bytes: bytes | None = None,
        audio_mime_type: str = "audio/wav",
    ) -> dict[str, Any]:
        """Gemini에 프롬프트 전송 후 structured JSON 응답 반환."""
        return await asyncio.to_thread(
            self._generate_sync,
            prompt,
            system_instruction,
            audio_bytes,
            audio_mime_type,
        )

    def _generate_sync(
        self,
        prompt: str,
        system_instruction: str,
        audio_bytes: bytes | None,
        audio_mime_type: str,
    ) -> dict[str, Any]:
        """동기 Gemini API 호출."""
        import google.generativeai as genai

        genai.configure(api_key=self._api_key)

        model = genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system_instruction or None,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        # 컨텐츠 구성
        contents: list[Any] = []
        if audio_bytes:
            contents.append({
                "mime_type": audio_mime_type,
                "data": audio_bytes,
            })
        contents.append(prompt)

        response = model.generate_content(contents)
        raw_text = response.text.strip()

        # JSON 파싱
        try:
            result = json.loads(raw_text)
        except json.JSONDecodeError:
            logger.warning("Gemini response is not valid JSON: %s", raw_text[:200])
            # JSON 블록 추출 시도
            if "{" in raw_text and "}" in raw_text:
                json_start = raw_text.index("{")
                json_end = raw_text.rindex("}") + 1
                result = json.loads(raw_text[json_start:json_end])
            else:
                raise ValueError(f"Cannot parse Gemini response as JSON: {raw_text[:200]}")

        # 필수 필드 검증
        _validate_response(result)
        return result


def _validate_response(result: dict) -> None:
    """LLM 응답의 필수 필드 및 값 범위를 검증."""
    action = result.get("recommended_action")
    if action not in ("confirm", "reject", "fix"):
        raise ValueError(f"Invalid recommended_action: {action}")

    confidence = result.get("llm_confidence")
    if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 100:
        raise ValueError(f"Invalid llm_confidence: {confidence}")

    if "explanation" not in result:
        raise ValueError("Missing 'explanation' in response")
