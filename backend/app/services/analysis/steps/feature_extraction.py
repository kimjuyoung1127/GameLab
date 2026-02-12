"""FeatureExtractionStep: Goertzel 밴드 에너지 추출 (JSON bands 기준).

Ported from SoundLab/frontend/src/core/magi.py calculate_band_energy()
Numba JIT 대신 numpy 벡터 연산으로 구현.
"""
import logging

import numpy as np

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


def calculate_band_energy(
    samples: np.ndarray,
    sample_rate: int,
    center_freq: float,
    bandwidth: float,
    step: float = 0.5,
    stride: int = 8,
) -> float:
    """특정 대역폭 내의 주파수 에너지를 합산.

    center_freq ± bandwidth 범위에서 step 간격으로 DFT 상관을 계산.
    stride로 샘플을 건너뛰어 속도 향상 (SoundLab JS 원본과 동일).
    """
    n = len(samples)
    if n == 0:
        return 0.0

    indices = np.arange(0, n, stride)
    strided_samples = samples[indices]
    norm_factor = len(indices) / 2.0
    if norm_factor == 0:
        return 0.0

    total_energy = 0.0
    start_f = center_freq - bandwidth
    end_f = center_freq + bandwidth

    current_f = start_f
    while current_f <= end_f + 1e-9:
        omega = (2.0 * np.pi * current_f) / sample_rate
        angles = omega * indices

        real_part = np.dot(strided_samples, np.cos(angles))
        imag_part = np.dot(strided_samples, np.sin(angles))

        mag = np.sqrt(real_part * real_part + imag_part * imag_part) / norm_factor
        total_energy += mag
        current_f += step

    return total_energy


class FeatureExtractionStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        config = ctx.config
        signal = ctx.signal
        sample_rate = ctx.sample_rate

        chunk_duration = config.get("chunk_duration_sec", 5.0)
        bands = config.get("bands", {})

        chunk_samples = int(chunk_duration * sample_rate)
        num_chunks = len(signal) // chunk_samples if chunk_samples > 0 else 0

        # 밴드별 에너지 배열 초기화
        for band_key in bands:
            ctx.energies[band_key] = []

        # 청크별 결과 초기화
        ctx.chunks = []

        for i in range(num_chunks):
            start = i * chunk_samples
            end = start + chunk_samples
            chunk = signal[start:end]

            chunk_result = {
                "id": i,
                "time_sec": i * chunk_duration,
                "time_min": (i * chunk_duration) / 60.0,
                "state": "OFF",
                "note": "",
            }

            for band_key, band_cfg in bands.items():
                freq = band_cfg["freq"]
                bw = band_cfg["bw"]
                energy = calculate_band_energy(chunk, sample_rate, freq, bw)
                ctx.energies[band_key].append(energy)
                chunk_result[f"energy_{band_key}"] = energy

            ctx.chunks.append(chunk_result)

        # list → numpy array 변환 (후속 스텝 편의)
        for band_key in bands:
            ctx.energies[band_key] = np.array(ctx.energies[band_key])

        ctx.metadata["num_chunks"] = num_chunks
        ctx.metadata["chunk_duration_sec"] = chunk_duration

        logger.info(
            "feature_extraction chunks=%d bands=%s",
            num_chunks, list(bands.keys()),
        )
        return ctx
