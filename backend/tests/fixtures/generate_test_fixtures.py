"""합성 WAV 테스트 픽스쳐 생성.

바이너리 파일을 git에 넣지 않고, numpy로 프로그래밍 방식으로 생성.

Usage:
    python -m tests.fixtures.generate_test_fixtures
    python tests/fixtures/generate_test_fixtures.py
"""
import os

import numpy as np
from scipy.io import wavfile

SR = 44100  # 44.1kHz
FIXTURES_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(FIXTURES_DIR, "audio")


def _ensure_dir():
    os.makedirs(AUDIO_DIR, exist_ok=True)


def generate_machine_on(output_path: str, duration_sec: float = 120.0) -> None:
    """~2분: silence(30s) + 535Hz tone(60s) + silence(30s).

    중간 60초 구간에 535Hz 톤이 있어서 ID band 감지가 되어야 함.
    """
    n_samples = int(SR * duration_sec)
    t = np.arange(n_samples, dtype=np.float32) / SR
    signal = np.zeros(n_samples, dtype=np.float32)

    # 30s ~ 90s 구간에 535Hz 사인파 삽입
    tone_start = int(30 * SR)
    tone_end = int(90 * SR)
    signal[tone_start:tone_end] = 0.5 * np.sin(2 * np.pi * 535.0 * t[tone_start:tone_end])

    # 약한 노이즈 추가
    signal += np.random.default_rng(42).normal(0, 0.005, n_samples).astype(np.float32)

    wavfile.write(output_path, SR, signal)
    print(f"  Generated: {output_path} ({duration_sec}s)")


def generate_startup_surge(output_path: str, duration_sec: float = 60.0) -> None:
    """~1분: 첫 10초에 60Hz + 120Hz burst.

    시작 서지 감지가 되어야 함.
    """
    n_samples = int(SR * duration_sec)
    t = np.arange(n_samples, dtype=np.float32) / SR
    signal = np.zeros(n_samples, dtype=np.float32)

    # 0s ~ 10s 구간에 60Hz + 120Hz 동시 삽입
    surge_end = int(10 * SR)
    signal[:surge_end] = (
        0.4 * np.sin(2 * np.pi * 60.0 * t[:surge_end])
        + 0.3 * np.sin(2 * np.pi * 120.0 * t[:surge_end])
    )

    # 약한 노이즈
    signal += np.random.default_rng(43).normal(0, 0.005, n_samples).astype(np.float32)

    wavfile.write(output_path, SR, signal)
    print(f"  Generated: {output_path} ({duration_sec}s)")


def generate_silence(output_path: str, duration_sec: float = 30.0) -> None:
    """~30초: 노이즈 플로어만. 감지 결과 0개여야 함."""
    n_samples = int(SR * duration_sec)
    signal = np.random.default_rng(44).normal(0, 0.005, n_samples).astype(np.float32)

    wavfile.write(output_path, SR, signal)
    print(f"  Generated: {output_path} ({duration_sec}s)")


def main():
    _ensure_dir()
    print("Generating test fixtures...")

    generate_machine_on(os.path.join(AUDIO_DIR, "sample_01_machine_on.wav"))
    generate_startup_surge(os.path.join(AUDIO_DIR, "sample_02_startup_surge.wav"))
    generate_silence(os.path.join(AUDIO_DIR, "sample_03_silence.wav"))

    print("Done!")


if __name__ == "__main__":
    main()
