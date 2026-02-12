"""SoundLab V5.7 Engine — 실제 분석 알고리즘 구현.

JSON 설정 파일에서 파이프라인을 조립하고,
분석 결과를 SuggestionDraft 리스트로 변환한다.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Optional

from app.core.config import settings
from app.services.analysis.engine import AnalysisEngine, SuggestionDraft
from app.services.analysis.pipeline import AnalysisContext
from app.services.analysis.steps import build_pipeline

logger = logging.getLogger(__name__)

_CONFIG_FILENAME = "analysis_v57.json"


def _load_json_config() -> dict:
    """JSON 설정 파일 로드."""
    config_path = os.path.join(settings.analysis_config_dir, _CONFIG_FILENAME)
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _compute_confidence(energy: float, threshold: float) -> int:
    """에너지/임계값 비율을 0-100 confidence로 매핑.

    ratio < 0.8  → 0
    ratio = 1.0  → 50
    ratio = 2.0  → 95
    ratio > 2.0  → clamp to 100
    """
    if threshold <= 0:
        return 50
    ratio = energy / threshold
    if ratio < 0.8:
        return 0
    elif ratio <= 1.0:
        return int((ratio - 0.8) / 0.2 * 50)
    elif ratio <= 2.0:
        return int(50 + (ratio - 1.0) / 1.0 * 45)
    else:
        return min(100, int(95 + (ratio - 2.0) * 2.5))


def _segments_to_drafts(ctx: AnalysisContext) -> list[SuggestionDraft]:
    """연속 ON 청크를 세그먼트로 병합 → SuggestionDraft 리스트 변환."""
    config = ctx.config
    bands = config.get("bands", {})
    chunk_duration = config.get("chunk_duration_sec", 5.0)
    threshold_id = ctx.thresholds.get("id_wide", 0.0)
    energies_id = ctx.energies.get("id_wide", [])
    chunks = ctx.chunks

    drafts: list[SuggestionDraft] = []

    seg_start: Optional[int] = None
    seg_energies: list[float] = []
    seg_notes: set[str] = set()

    def flush_segment(start_idx: int, end_idx: int) -> None:
        start_time = chunks[start_idx]["time_sec"]
        end_time = chunks[end_idx]["time_sec"] + chunk_duration

        max_energy = max(seg_energies) if seg_energies else 0
        confidence = _compute_confidence(max_energy, threshold_id)

        # 라벨/밴드 결정
        if "Startup_Surge_Start" in seg_notes:
            band_type = "surge_60"
        else:
            band_type = "id_wide"

        band_cfg = bands.get(band_type, {})
        label = band_cfg.get("label", "Detected Segment")
        freq = band_cfg.get("freq", 535.0)
        bw = band_cfg.get("bw", 10.0)
        freq_low = int(freq - bw)
        freq_high = int(freq + bw)

        description = (
            f"V5.7: {label} ({start_time:.0f}s ~ {end_time:.0f}s), "
            f"confidence {confidence}%"
        )

        drafts.append(SuggestionDraft(
            label=label,
            confidence=confidence,
            description=description,
            start_time=start_time,
            end_time=end_time,
            freq_low=freq_low,
            freq_high=freq_high,
            band_type=band_type,
            metadata={
                "max_energy": max_energy,
                "avg_energy": sum(seg_energies) / len(seg_energies) if seg_energies else 0,
            },
        ))

    for i, chunk in enumerate(chunks):
        if chunk["state"] == "ON":
            if seg_start is None:
                seg_start = i
                seg_energies = []
                seg_notes = set()
            energy = energies_id[i] if i < len(energies_id) else 0
            seg_energies.append(energy)
            if chunk.get("note"):
                seg_notes.add(chunk["note"])
        else:
            if seg_start is not None:
                flush_segment(seg_start, i - 1)
                seg_start = None

    # 마지막 세그먼트
    if seg_start is not None:
        flush_segment(seg_start, len(chunks) - 1)

    return drafts


class SoundLabV57Engine(AnalysisEngine):
    """SoundLab V5.7 분석 엔진.

    JSON config에서 파이프라인을 조립하여 실행.
    CPU-bound 작업은 스레드풀에서 실행하여 이벤트 루프 차단 방지.
    """

    def __init__(self) -> None:
        self._config = _load_json_config()
        self._pipeline = build_pipeline(self._config)

    async def analyze(
        self, file_path: str, config: dict | None = None
    ) -> list[SuggestionDraft]:
        merged_config = {**self._config, **(config or {})}

        loop = asyncio.get_event_loop()
        ctx = await loop.run_in_executor(
            None, self._pipeline.run, file_path, merged_config
        )

        drafts = _segments_to_drafts(ctx)
        return drafts
