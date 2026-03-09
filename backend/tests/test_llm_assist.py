"""LLM Assist 단위/통합 테스트 (mock 기반).

테스트 대상: prompt_builder, provider 검증, service 흐름.
실행: cd backend && python -m pytest tests/test_llm_assist.py -v
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# backend/ on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.models.llm_assist import LlmInputMode, LlmRecommendedAction
from app.services.llm_assist.prompt_builder import (
    SYSTEM_INSTRUCTION,
    build_audio_clip_prompt,
    build_text_features_prompt,
)
from app.services.llm_assist.provider import _validate_response


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_SUGGESTION = {
    "id": "sug-test1",
    "audio_id": "aud-test1",
    "label": "Knock",
    "confidence": 42,
    "description": "Low-frequency transient event",
    "start_time": 5.0,
    "end_time": 5.5,
    "freq_low": 100,
    "freq_high": 800,
    "status": "pending",
}

SAMPLE_AUDIO_META = {
    "sample_rate": 44100,
    "duration": 60.0,
}


# ---------------------------------------------------------------------------
# prompt_builder tests
# ---------------------------------------------------------------------------

class TestPromptBuilder:
    """프롬프트 빌더 검증."""

    def test_text_features_contains_required_fields(self):
        prompt = build_text_features_prompt(SAMPLE_SUGGESTION, SAMPLE_AUDIO_META)
        assert "Knock" in prompt
        assert "42%" in prompt
        assert "5.00s" in prompt
        assert "5.50s" in prompt
        assert "100" in prompt
        assert "800" in prompt
        assert "Low-frequency transient event" in prompt
        assert "44100" in prompt

    def test_text_features_excludes_pii(self):
        suggestion = {**SAMPLE_SUGGESTION, "session_id": "ses-secret", "user_id": "u-123"}
        prompt = build_text_features_prompt(suggestion, SAMPLE_AUDIO_META)
        assert "ses-secret" not in prompt
        assert "u-123" not in prompt

    def test_audio_clip_prompt_has_listen_instruction(self):
        prompt = build_audio_clip_prompt(SAMPLE_SUGGESTION, SAMPLE_AUDIO_META)
        assert "Listen" in prompt
        assert "audio clip" in prompt

    def test_audio_clip_excludes_pii(self):
        suggestion = {**SAMPLE_SUGGESTION, "filename": "secret.wav"}
        prompt = build_audio_clip_prompt(suggestion, SAMPLE_AUDIO_META)
        assert "secret.wav" not in prompt

    def test_system_instruction_is_not_empty(self):
        assert len(SYSTEM_INSTRUCTION) > 0
        assert "sound" in SYSTEM_INSTRUCTION.lower()

    def test_duration_calculated_correctly(self):
        prompt = build_text_features_prompt(SAMPLE_SUGGESTION, SAMPLE_AUDIO_META)
        assert "0.50s" in prompt  # 5.5 - 5.0


# ---------------------------------------------------------------------------
# _validate_response tests
# ---------------------------------------------------------------------------

class TestValidateResponse:
    """provider._validate_response 검증."""

    def test_valid_confirm(self):
        result = {
            "recommended_action": "confirm",
            "llm_confidence": 85,
            "explanation": "Clear knock sound detected.",
        }
        _validate_response(result)  # no exception

    def test_valid_fix_with_label(self):
        result = {
            "recommended_action": "fix",
            "suggested_label": "Impact",
            "llm_confidence": 60,
            "explanation": "Sound exists but label should be changed.",
        }
        _validate_response(result)

    def test_invalid_action_raises(self):
        result = {
            "recommended_action": "delete",
            "llm_confidence": 50,
            "explanation": "test",
        }
        with pytest.raises(ValueError, match="Invalid recommended_action"):
            _validate_response(result)

    def test_missing_explanation_raises(self):
        result = {
            "recommended_action": "confirm",
            "llm_confidence": 50,
        }
        with pytest.raises(ValueError, match="Missing 'explanation'"):
            _validate_response(result)

    def test_confidence_out_of_range_raises(self):
        result = {
            "recommended_action": "confirm",
            "llm_confidence": 150,
            "explanation": "test",
        }
        with pytest.raises(ValueError, match="Invalid llm_confidence"):
            _validate_response(result)

    def test_negative_confidence_raises(self):
        result = {
            "recommended_action": "reject",
            "llm_confidence": -1,
            "explanation": "test",
        }
        with pytest.raises(ValueError, match="Invalid llm_confidence"):
            _validate_response(result)

    def test_confidence_boundary_zero(self):
        result = {
            "recommended_action": "reject",
            "llm_confidence": 0,
            "explanation": "No event detected.",
        }
        _validate_response(result)  # 0 is valid

    def test_confidence_boundary_hundred(self):
        result = {
            "recommended_action": "confirm",
            "llm_confidence": 100,
            "explanation": "Very confident.",
        }
        _validate_response(result)  # 100 is valid


# ---------------------------------------------------------------------------
# Service orchestration tests (mock DB + mock provider)
# ---------------------------------------------------------------------------


def _build_mock_supabase():
    """테이블별 체인 mock을 생성하는 헬퍼."""
    mock = MagicMock()

    def table_dispatch(name):
        tbl = MagicMock()
        if name == 'sst_suggestions':
            chain = MagicMock()
            chain.execute.return_value = MagicMock(data=SAMPLE_SUGGESTION)
            tbl.select.return_value.eq.return_value.single.return_value = chain
        elif name == 'sst_audio_files':
            chain = MagicMock()
            chain.execute.return_value = MagicMock(data={
                'id': 'aud-test1',
                'sample_rate': '44100',
                'duration': '60.0',
            })
            tbl.select.return_value.eq.return_value.single.return_value = chain
        elif name == 'sst_suggestion_llm_reviews':
            insert_chain = MagicMock()
            insert_chain.execute.return_value = MagicMock(data={})
            tbl.insert.return_value = insert_chain
        return tbl

    mock.table.side_effect = table_dispatch
    return mock


class TestSuggestionAssistService:
    """SuggestionAssistService 오케스트레이션 흐름 (mock)."""

    @pytest.fixture
    def mock_provider(self):
        provider = MagicMock()
        provider.generate = AsyncMock(return_value={
            'recommended_action': 'confirm',
            'suggested_label': None,
            'llm_confidence': 78,
            'explanation': 'A clear knock event is audible in the clip.',
        })
        return provider

    @pytest.mark.asyncio
    async def test_text_features_mode_returns_response(self, mock_provider):
        mock_sb = _build_mock_supabase()
        with patch('app.services.llm_assist.service.supabase', mock_sb):
            from app.services.llm_assist.service import SuggestionAssistService

            svc = SuggestionAssistService(provider=mock_provider)
            resp = await svc.assist('sug-test1', input_mode=LlmInputMode.text_features)

            assert resp.recommended_action == 'confirm'
            assert resp.llm_confidence == 78
            assert resp.suggestion_id == 'sug-test1'
            mock_provider.generate.assert_called_once()

    @pytest.mark.asyncio
    async def test_audio_clip_fallback_on_extraction_failure(self, mock_provider):
        mock_sb = _build_mock_supabase()
        with patch('app.services.llm_assist.service.supabase', mock_sb),              patch('app.services.llm_assist.service.extract_clip', side_effect=Exception('download failed')):
            from app.services.llm_assist.service import SuggestionAssistService

            svc = SuggestionAssistService(provider=mock_provider)
            resp = await svc.assist('sug-test1', input_mode=LlmInputMode.audio_clip)

            assert resp.input_mode == LlmInputMode.text_features
            mock_provider.generate.assert_called_once()
