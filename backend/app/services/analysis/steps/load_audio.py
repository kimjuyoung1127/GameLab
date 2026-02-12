"""LoadAudioStep: WAV 로딩, stereo→mono, float32 변환.

Ported from SoundLab/frontend/src/core/audio.py
"""
import logging
import os

import numpy as np
from scipy.io import wavfile

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)

# 200MB 이상은 memory-mapped I/O 사용
_MMAP_THRESHOLD_MB = 200


class LoadAudioStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        file_path = ctx.file_path

        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        use_mmap = size_mb > _MMAP_THRESHOLD_MB

        sample_rate, data = wavfile.read(file_path, mmap=use_mmap)

        # Stereo → Mono
        if len(data.shape) > 1:
            data = data.mean(axis=1)

        # Normalize to float32 [-1.0, 1.0]
        if data.dtype == np.int16:
            data = data.astype(np.float32) / 32768.0
        elif data.dtype == np.uint8:
            data = (data.astype(np.float32) - 128.0) / 128.0
        elif data.dtype not in (np.float32, np.float64):
            data = data.astype(np.float32)

        ctx.sample_rate = sample_rate
        ctx.signal = data
        ctx.metadata["file_size_mb"] = round(size_mb, 1)
        ctx.metadata["mmap"] = use_mmap

        logger.info(
            "load_audio file=%s size_mb=%.1f sr=%d samples=%d",
            file_path, size_mb, sample_rate, len(data),
        )
        return ctx
