"""LLM 프롬프트 빌더: suggestion 메타데이터 기반 프롬프트 생성 (PII 제외)."""
from __future__ import annotations

import re


def _sanitize_field(value: str, max_len: int = 500) -> str:
    """제어문자 제거 + 길이 제한으로 prompt injection 방어."""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", str(value))
    return cleaned[:max_len]


SYSTEM_INSTRUCTION = (
    "You are a sound event analysis expert. "
    "Your task is to evaluate whether a detected sound annotation is correct."
)

_TEXT_FEATURES_TEMPLATE = """\
Evaluate this sound event annotation based on the provided features.

## Annotation Details
- Current label: {label}
- Engine confidence: {confidence}%
- Time range: {start_time:.2f}s – {end_time:.2f}s (duration: {duration:.2f}s)
- Frequency range: {freq_low} – {freq_high} Hz
- Engine description: {description}

## Audio Context
- Sample rate: {sample_rate} Hz
- Total file duration: {file_duration:.1f}s

## Your Task
1. Based on these features, assess whether a real sound event likely exists in this segment.
2. Recommend one action: confirm (event is real), reject (likely false positive), or fix (real but needs label correction).
3. If you recommend "fix", suggest a better label.
4. Provide a brief explanation (2-3 sentences).

Respond ONLY with valid JSON:
{{"recommended_action": "confirm"|"reject"|"fix", "suggested_label": "string or null", "llm_confidence": 0-100, "explanation": "string"}}"""

_AUDIO_CLIP_TEMPLATE = """\
Listen to the provided audio clip and evaluate this sound event annotation.

## Annotation Details
- Current label: {label}
- Engine confidence: {confidence}%
- Time range: {start_time:.2f}s – {end_time:.2f}s (duration: {duration:.2f}s)
- Frequency range: {freq_low} – {freq_high} Hz
- Engine description: {description}

## Your Task
1. Listen to the audio clip carefully. Is there a distinct sound event in this segment?
2. What type of sound is it? (general description)
3. Recommend one action: confirm (event is real), reject (likely false positive), or fix (real but needs label correction).
4. If you recommend "fix", suggest a better label.
5. Provide a brief explanation (2-3 sentences) referencing what you heard.

Respond ONLY with valid JSON:
{{"recommended_action": "confirm"|"reject"|"fix", "suggested_label": "string or null", "llm_confidence": 0-100, "explanation": "string"}}"""


def build_text_features_prompt(
    suggestion: dict,
    audio_meta: dict,
) -> str:
    """text_features 모드 프롬프트 생성. PII(sessionId, filename, userId) 제외."""
    start = suggestion.get("start_time", 0)
    end = suggestion.get("end_time", 0)
    return _TEXT_FEATURES_TEMPLATE.format(
        label=_sanitize_field(suggestion.get("label", "Unknown"), 100),
        confidence=suggestion.get("confidence", 0),
        start_time=start,
        end_time=end,
        duration=end - start,
        freq_low=suggestion.get("freq_low", 0),
        freq_high=suggestion.get("freq_high", 0),
        description=_sanitize_field(suggestion.get("description", ""), 500),
        sample_rate=audio_meta.get("sample_rate", 0),
        file_duration=audio_meta.get("duration", 0),
    )


def build_audio_clip_prompt(
    suggestion: dict,
    audio_meta: dict,
) -> str:
    """audio_clip 모드 프롬프트 생성. 오디오 클립과 함께 전송. PII 제외."""
    start = suggestion.get("start_time", 0)
    end = suggestion.get("end_time", 0)
    return _AUDIO_CLIP_TEMPLATE.format(
        label=_sanitize_field(suggestion.get("label", "Unknown"), 100),
        confidence=suggestion.get("confidence", 0),
        start_time=start,
        end_time=end,
        duration=end - start,
        freq_low=suggestion.get("freq_low", 0),
        freq_high=suggestion.get("freq_high", 0),
        description=_sanitize_field(suggestion.get("description", ""), 500),
    )
