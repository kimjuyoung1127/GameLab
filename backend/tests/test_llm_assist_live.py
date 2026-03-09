"""LLM Assist 실제 Gemini API 호출 테스트.

GOOGLE_API_KEY 환경변수가 없으면 자동 스킵.
실행: cd backend && python -m pytest tests/test_llm_assist_live.py -v
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

pytestmark = pytest.mark.skipif(
    not GOOGLE_API_KEY,
    reason="GOOGLE_API_KEY not set — skip live Gemini tests",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_test_wav(duration_sec: float = 2.0, sr: int = 16000) -> bytes:
    """테스트용 사인파 WAV 생성 (440Hz)."""
    t = np.linspace(0, duration_sec, int(sr * duration_sec), dtype=np.float32)
    data = 0.5 * np.sin(2 * np.pi * 440 * t)
    buf = io.BytesIO()
    sf.write(buf, data, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


SAMPLE_SUGGESTION = {
    "id": "sug-live-test",
    "audio_id": "aud-live-test",
    "label": "Tone",
    "confidence": 55,
    "description": "Continuous tonal event at 440Hz",
    "start_time": 0.0,
    "end_time": 2.0,
    "freq_low": 400,
    "freq_high": 500,
    "status": "pending",
}

SAMPLE_AUDIO_META = {
    "sample_rate": 16000,
    "duration": 2.0,
}


# ---------------------------------------------------------------------------
# Live Tests
# ---------------------------------------------------------------------------

class TestGeminiLive:
    """실제 Gemini API를 호출하는 통합 테스트."""

    def test_text_features_mode(self):
        """text_features 모드: 메타데이터만으로 structured JSON 응답 확인."""
        from app.services.llm_assist.prompt_builder import (
            SYSTEM_INSTRUCTION,
            build_text_features_prompt,
        )
        from app.services.llm_assist.provider import GeminiProvider

        provider = GeminiProvider(api_key=GOOGLE_API_KEY)
        prompt = build_text_features_prompt(SAMPLE_SUGGESTION, SAMPLE_AUDIO_META)

        import asyncio
        result = asyncio.run(provider.generate(
            prompt=prompt,
            system_instruction=SYSTEM_INSTRUCTION,
        ))

        # 응답 구조 검증
        assert result["recommended_action"] in ("confirm", "reject", "fix")
        assert 0 <= result["llm_confidence"] <= 100
        assert len(result["explanation"]) > 0
        print(f"\n[text_features] action={result['recommended_action']}, "
              f"confidence={result['llm_confidence']}, "
              f"explanation={result['explanation'][:100]}")

    def test_audio_clip_mode(self):
        """audio_clip 모드: 실제 오디오 바이트 + 메타데이터 전송."""
        from app.services.llm_assist.prompt_builder import (
            SYSTEM_INSTRUCTION,
            build_audio_clip_prompt,
        )
        from app.services.llm_assist.provider import GeminiProvider

        provider = GeminiProvider(api_key=GOOGLE_API_KEY)
        prompt = build_audio_clip_prompt(SAMPLE_SUGGESTION, SAMPLE_AUDIO_META)
        wav_bytes = _make_test_wav()

        import asyncio
        result = asyncio.run(provider.generate(
            prompt=prompt,
            system_instruction=SYSTEM_INSTRUCTION,
            audio_bytes=wav_bytes,
        ))

        assert result["recommended_action"] in ("confirm", "reject", "fix")
        assert 0 <= result["llm_confidence"] <= 100
        assert len(result["explanation"]) > 0
        print(f"\n[audio_clip] action={result['recommended_action']}, "
              f"confidence={result['llm_confidence']}, "
              f"explanation={result['explanation'][:100]}")

    def test_reject_scenario(self):
        """노이즈/무음 → reject 가능성 높은 시나리오."""
        from app.services.llm_assist.prompt_builder import (
            SYSTEM_INSTRUCTION,
            build_text_features_prompt,
        )
        from app.services.llm_assist.provider import GeminiProvider

        noisy_suggestion = {
            **SAMPLE_SUGGESTION,
            "label": "Impact",
            "confidence": 15,
            "description": "Very faint, possibly noise artifact",
            "freq_low": 50,
            "freq_high": 20000,
        }
        provider = GeminiProvider(api_key=GOOGLE_API_KEY)
        prompt = build_text_features_prompt(noisy_suggestion, SAMPLE_AUDIO_META)

        import asyncio
        result = asyncio.run(provider.generate(
            prompt=prompt,
            system_instruction=SYSTEM_INSTRUCTION,
        ))

        assert result["recommended_action"] in ("confirm", "reject", "fix")
        assert 0 <= result["llm_confidence"] <= 100
        print(f"\n[reject_scenario] action={result['recommended_action']}, "
              f"confidence={result['llm_confidence']}")
