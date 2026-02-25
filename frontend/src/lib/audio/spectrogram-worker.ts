/** Web Worker: 메인 스레드 블로킹 없이 FFT 스펙트로그램을 연산한다. */

import { computeSpectrogram, DEFAULT_OPTIONS } from "./spectrogram-renderer";

export interface SpectrogramWorkerInput {
  channelData: Float32Array;
  sampleRate: number;
  fftSize?: number;
  hopSize?: number;
  windowFn?: "hann" | "hamming" | "blackman";
  minDb?: number;
  maxDb?: number;
  maxFrames?: number;
  /** 표시 주파수 하한 Hz */
  freqMin?: number;
  /** 표시 주파수 상한 Hz */
  freqMax?: number;
}

export interface SpectrogramWorkerOutput {
  /** RGBA pixel buffer (Transferable) */
  buffer: ArrayBuffer;
  width: number;
  height: number;
  maxFrequency: number;
  sampleRate: number;
  duration: number;
  /** Actual rendered frequency range lower bound Hz */
  freqMin: number;
  /** Actual rendered frequency range upper bound Hz */
  freqMax: number;
}

self.onmessage = (e: MessageEvent<SpectrogramWorkerInput>) => {
  const {
    channelData,
    sampleRate,
    fftSize = DEFAULT_OPTIONS.fftSize,
    hopSize = DEFAULT_OPTIONS.hopSize,
    windowFn = DEFAULT_OPTIONS.windowFn,
    minDb = DEFAULT_OPTIONS.minDb,
    maxDb = DEFAULT_OPTIONS.maxDb,
    maxFrames = DEFAULT_OPTIONS.maxFrames,
    freqMin,
    freqMax,
  } = e.data;

  const nyquist = sampleRate / 2;
  const result = computeSpectrogram(channelData, {
    fftSize,
    hopSize,
    windowFn,
    minDb,
    maxDb,
    sampleRate,
    maxFrames,
    freqMin,
    freqMax,
  });

  // Compute actual frequency bounds from bin indices
  const totalBins = fftSize >> 1;
  const actualFreqMin = (result.binMin / totalBins) * nyquist;
  const actualFreqMax = (result.binMax / totalBins) * nyquist;

  const output: SpectrogramWorkerOutput = {
    buffer: result.imageData.buffer as ArrayBuffer,
    width: result.width,
    height: result.height,
    maxFrequency: nyquist,
    sampleRate,
    duration: channelData.length / sampleRate,
    freqMin: actualFreqMin,
    freqMax: actualFreqMax,
  };

  // Transfer buffer ownership to main thread (zero-copy)
  (postMessage as (msg: unknown, transfer: Transferable[]) => void)(output, [output.buffer]);
};
