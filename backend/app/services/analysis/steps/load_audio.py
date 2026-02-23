"""LoadAudioStep: 멀티포맷 오디오 로딩 (WAV/FLAC/OGG + MP3/M4A ffmpeg 폴백), stereo→mono, float32 변환."""
import logging
import os
import shutil
import subprocess
import tempfile

import numpy as np
import soundfile as sf

from app.services.analysis.pipeline import AnalysisContext, PipelineStep

logger = logging.getLogger(__name__)


def _read_audio(file_path: str) -> tuple[int, np.ndarray]:
    """Read audio file via soundfile, with ffmpeg fallback for MP3/M4A/AAC."""
    # soundfile handles WAV, FLAC, OGG, AIFF natively
    try:
        data, sample_rate = sf.read(file_path, dtype="float32")
        return sample_rate, data
    except Exception:
        logger.info("soundfile cannot read %s, trying ffmpeg fallback", file_path)

    # ffmpeg fallback for MP3, M4A, AAC, etc.
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        raise RuntimeError(
            f"Cannot read {file_path}: soundfile failed and ffmpeg not found"
        )

    tmp_wav = None
    try:
        fd, tmp_wav = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        subprocess.run(
            [ffmpeg_path, "-y", "-i", file_path,
             "-f", "wav", "-acodec", "pcm_s16le", tmp_wav],
            capture_output=True, check=True, timeout=120,
        )
        data, sample_rate = sf.read(tmp_wav, dtype="float32")
        return sample_rate, data
    finally:
        if tmp_wav and os.path.exists(tmp_wav):
            try:
                os.remove(tmp_wav)
            except OSError:
                pass


class LoadAudioStep(PipelineStep):
    def execute(self, ctx: AnalysisContext) -> AnalysisContext:
        file_path = ctx.file_path

        size_mb = os.path.getsize(file_path) / (1024 * 1024)

        sample_rate, data = _read_audio(file_path)

        # Stereo → Mono
        if len(data.shape) > 1:
            data = data.mean(axis=1)

        # Ensure float32
        if data.dtype != np.float32:
            data = data.astype(np.float32)

        ctx.sample_rate = sample_rate
        ctx.signal = data
        ctx.metadata["file_size_mb"] = round(size_mb, 1)

        logger.info(
            "load_audio file=%s size_mb=%.1f sr=%d samples=%d",
            file_path, size_mb, sample_rate, len(data),
        )
        return ctx
