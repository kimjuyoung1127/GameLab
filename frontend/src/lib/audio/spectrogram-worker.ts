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
}

export interface SpectrogramWorkerOutput {
  /** RGBA pixel buffer (Transferable) */
  buffer: ArrayBuffer;
  width: number;
  height: number;
  maxFrequency: number;
  sampleRate: number;
  duration: number;
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
  } = e.data;

  const result = computeSpectrogram(channelData, {
    fftSize,
    hopSize,
    windowFn,
    minDb,
    maxDb,
    sampleRate,
    maxFrames,
  });

  const output: SpectrogramWorkerOutput = {
    buffer: result.imageData.buffer as ArrayBuffer,
    width: result.width,
    height: result.height,
    maxFrequency: sampleRate / 2,
    sampleRate,
    duration: channelData.length / sampleRate,
  };

  // Transfer buffer ownership to main thread (zero-copy)
  (postMessage as (msg: unknown, transfer: Transferable[]) => void)(output, [output.buffer]);
};
