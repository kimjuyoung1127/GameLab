"""Analysis Engine Test Harness (Sprint 12.3).

Usage:
    cd backend
    python -m pytest tests/test_analysis_harness.py -v
    python -m pytest tests/test_analysis_harness.py -v -k "step"
    python -m pytest tests/test_analysis_harness.py -v -k "pipeline"
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

import numpy as np
import pytest

# Ensure backend/ is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.analysis.engine import SuggestionDraft
from app.services.analysis.pipeline import AnalysisContext, AnalysisPipeline
from app.services.analysis.steps import build_pipeline, STEP_REGISTRY
from app.services.analysis.steps.load_audio import LoadAudioStep
from app.services.analysis.steps.feature_extraction import (
    FeatureExtractionStep,
    calculate_band_energy,
)
from app.services.analysis.steps.threshold import OtsuThresholdStep
from app.services.analysis.steps.state_machine import StateMachineStep
from app.services.analysis.steps.gap_fill import GapFillStep
from app.services.analysis.steps.trim import TrimStep
from app.services.analysis.steps.noise_removal import NoiseRemovalStep

FIXTURES_DIR = Path(__file__).parent / "fixtures"
AUDIO_DIR = FIXTURES_DIR / "audio"
EXPECTED_DIR = FIXTURES_DIR / "expected"

# JSON config for testing (V5.7 default)
CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "analysis_v57.json"


def _load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _get_sample_path(name: str) -> str:
    p = AUDIO_DIR / name
    if not p.exists():
        pytest.skip(f"Sample file {name} not found. Run generate_test_fixtures.py first.")
    return str(p)


# ─── Fixture Generation Guard ───


@pytest.fixture(scope="session", autouse=True)
def ensure_fixtures():
    """Generate fixtures if they don't exist."""
    if not AUDIO_DIR.exists() or not list(AUDIO_DIR.glob("*.wav")):
        from tests.fixtures.generate_test_fixtures import main as gen_main
        gen_main()


# ─── Individual Step Tests ───


class TestLoadAudioStep:
    def test_loads_wav(self):
        path = _get_sample_path("sample_03_silence.wav")
        config = _load_config()
        ctx = AnalysisContext(file_path=path, config=config)
        step = LoadAudioStep()
        ctx = step.execute(ctx)

        assert ctx.sample_rate == 44100
        assert ctx.signal is not None
        assert ctx.signal.dtype == np.float32
        assert len(ctx.signal) > 0


class TestFeatureExtractionStep:
    def test_extracts_bands(self):
        path = _get_sample_path("sample_01_machine_on.wav")
        config = _load_config()
        ctx = AnalysisContext(file_path=path, config=config)

        ctx = LoadAudioStep().execute(ctx)
        ctx = FeatureExtractionStep().execute(ctx)

        assert len(ctx.chunks) > 0
        assert "id_wide" in ctx.energies
        assert len(ctx.energies["id_wide"]) == len(ctx.chunks)

    def test_band_energy_function(self):
        """535Hz 사인파에서 id_wide 밴드 에너지가 높아야 함."""
        sr = 44100
        t = np.arange(sr * 5, dtype=np.float32) / sr  # 5 seconds
        signal = 0.5 * np.sin(2 * np.pi * 535.0 * t)

        energy_535 = calculate_band_energy(signal, sr, 535.0, 10.0)
        energy_100 = calculate_band_energy(signal, sr, 100.0, 10.0)

        assert energy_535 > energy_100 * 5, "535Hz band energy should dominate"


class TestOtsuThresholdStep:
    def test_computes_threshold(self):
        path = _get_sample_path("sample_01_machine_on.wav")
        config = _load_config()
        ctx = AnalysisContext(file_path=path, config=config)

        ctx = LoadAudioStep().execute(ctx)
        ctx = FeatureExtractionStep().execute(ctx)
        ctx = OtsuThresholdStep().execute(ctx)

        assert "id_wide" in ctx.thresholds
        assert ctx.thresholds["id_wide"] >= 0


class TestStateMachineStep:
    def test_detects_on_off(self):
        path = _get_sample_path("sample_01_machine_on.wav")
        config = _load_config()
        ctx = AnalysisContext(file_path=path, config=config)

        ctx = LoadAudioStep().execute(ctx)
        ctx = FeatureExtractionStep().execute(ctx)
        ctx = OtsuThresholdStep().execute(ctx)
        ctx = StateMachineStep().execute(ctx)

        states = [c["state"] for c in ctx.chunks]
        assert "ON" in states, "Should detect some ON chunks for machine_on sample"
        assert "OFF" in states, "Should also have OFF chunks"


# ─── Pipeline Integration Tests ───


class TestPipelineFull:
    def test_machine_on_produces_suggestions(self):
        path = _get_sample_path("sample_01_machine_on.wav")
        config = _load_config()
        pipeline = build_pipeline(config)

        ctx = pipeline.run(path, config)

        # Import segments_to_drafts
        from app.services.analysis.soundlab_v57 import _segments_to_drafts
        drafts = _segments_to_drafts(ctx)

        assert len(drafts) >= 1, "Machine ON sample should produce at least 1 suggestion"

        for d in drafts:
            assert 0 <= d.confidence <= 100
            assert d.start_time >= 0
            assert d.end_time > d.start_time
            assert d.freq_low >= 0
            assert d.freq_high > d.freq_low
            assert d.label

    def test_silence_produces_no_suggestions(self):
        path = _get_sample_path("sample_03_silence.wav")
        config = _load_config()
        pipeline = build_pipeline(config)

        ctx = pipeline.run(path, config)

        from app.services.analysis.soundlab_v57 import _segments_to_drafts
        drafts = _segments_to_drafts(ctx)

        assert len(drafts) == 0, "Silence sample should produce 0 suggestions"

    def test_regression_machine_on(self):
        """Expected output 비교 (느슨한 범위 검사)."""
        expected_file = EXPECTED_DIR / "soundlab_v57_sample_01_machine_on.json"
        if not expected_file.exists():
            pytest.skip("Expected output file not found")

        expected = json.loads(expected_file.read_text())
        path = _get_sample_path("sample_01_machine_on.wav")
        config = _load_config()
        pipeline = build_pipeline(config)
        ctx = pipeline.run(path, config)

        from app.services.analysis.soundlab_v57 import _segments_to_drafts
        drafts = _segments_to_drafts(ctx)

        count = len(drafts)
        assert count >= expected["min_count"], f"Expected min {expected['min_count']} suggestions, got {count}"
        assert count <= expected["max_count"], f"Expected max {expected['max_count']} suggestions, got {count}"

        if expected.get("expected_labels"):
            labels = [d.label for d in drafts]
            for exp_label in expected["expected_labels"]:
                assert exp_label in labels, f"Expected label '{exp_label}' not found in {labels}"

        if expected.get("min_confidence"):
            for d in drafts:
                assert d.confidence >= expected["min_confidence"], (
                    f"Confidence {d.confidence} below minimum {expected['min_confidence']}"
                )


class TestBuildPipeline:
    def test_builds_from_config(self):
        config = _load_config()
        pipeline = build_pipeline(config)
        assert len(pipeline._steps) == 7

    def test_unknown_step_raises(self):
        config = {"steps": ["nonexistent_step"]}
        with pytest.raises(ValueError, match="Unknown pipeline step"):
            build_pipeline(config)

    def test_all_registered_steps(self):
        expected = {
            "load_audio", "feature_extraction", "threshold",
            "state_machine", "gap_fill", "trim", "noise_removal",
        }
        assert set(STEP_REGISTRY.keys()) == expected
