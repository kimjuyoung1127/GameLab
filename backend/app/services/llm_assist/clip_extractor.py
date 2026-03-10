"""오디오 클립 추출: Supabase Storage에서 다운로드 → soundfile seek → WAV bytes 반환."""
from __future__ import annotations

import asyncio
import io
import logging
import os
import tempfile
from pathlib import Path

import soundfile as sf

from app.core.config import settings
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)


def _extract_clip_sync(
    audio_file_row: dict,
    start_time: float,
    end_time: float,
) -> tuple[bytes, float, float]:
    """동기 클립 추출 본체. asyncio.to_thread()로 호출."""
    max_sec = settings.llm_max_clip_sec
    padding = 1.0  # 전후 여유

    # 1) Supabase Storage에서 파일 다운로드
    storage_path = audio_file_row.get("storage_path", "")
    bucket = audio_file_row.get("bucket", "audio-files")

    temp_path = None
    try:
        file_bytes = supabase.storage.from_(bucket).download(storage_path)
        temp_fd, temp_path = tempfile.mkstemp(suffix=".wav")
        os.close(temp_fd)
        Path(temp_path).write_bytes(file_bytes)

        # 2) 파일 정보 읽기
        info = sf.info(temp_path)
        sr = info.samplerate
        total_duration = info.duration

        # 3) 클립 범위 계산 (padding + max_sec 캡)
        clip_start = max(0.0, start_time - padding)
        clip_end = min(total_duration, end_time + padding)

        # max_sec 캡
        if clip_end - clip_start > max_sec:
            center = (start_time + end_time) / 2
            clip_start = max(0.0, center - max_sec / 2)
            clip_end = min(total_duration, clip_start + max_sec)

        start_frame = int(clip_start * sr)
        end_frame = int(clip_end * sr)

        # 4) soundfile seek으로 구간 읽기
        data, _ = sf.read(temp_path, start=start_frame, stop=end_frame, dtype="float32")

        # 5) BytesIO로 WAV 생성
        buf = io.BytesIO()
        sf.write(buf, data, sr, format="WAV", subtype="PCM_16")
        wav_bytes = buf.getvalue()

        logger.info(
            "clip_extracted start=%.2f end=%.2f frames=%d bytes=%d",
            clip_start, clip_end, end_frame - start_frame, len(wav_bytes),
        )
        return wav_bytes, clip_start, clip_end

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                logger.warning("Failed to cleanup temp file: %s", temp_path)


async def extract_clip(
    audio_file_row: dict,
    start_time: float,
    end_time: float,
) -> tuple[bytes, float, float]:
    """suggestion 주변 오디오 클립을 추출하여 WAV bytes로 반환.

    Returns:
        (wav_bytes, actual_start, actual_end)
    """
    return await asyncio.to_thread(
        _extract_clip_sync, audio_file_row, start_time, end_time,
    )
