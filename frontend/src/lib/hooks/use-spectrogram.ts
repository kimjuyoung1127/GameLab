/** useSpectrogram 훅: Web Worker로 FFT 스펙트로그램을 비동기 연산한다. */
"use client";

import { useEffect, useRef, useState } from "react";

import type { SpectrogramData, WaveformData } from "@/types";
import type { SpectrogramWorkerOutput } from "@/lib/audio/spectrogram-worker";
import { computeSpectrogram, DEFAULT_OPTIONS } from "@/lib/audio/spectrogram-renderer";

/** Safely create ImageData from pixel array (handles ArrayBufferLike TS quirk) */
function createImageData(pixels: Uint8ClampedArray, w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(pixels.length);
  data.set(pixels);
  return new ImageData(data, w, h);
}

interface UseSpectrogramResult {
  data: SpectrogramData | null;
  loading: boolean;
  error: string | null;
}

/**
 * WaveformData로부터 FFT 스펙트로그램을 연산한다.
 * Web Worker 사용 가능 시 오프스레드, 불가능 시 메인스레드 폴백.
 * freqMin/freqMax로 주파수 범위를 지정하면 해당 대역만 렌더링한다.
 */
export function useSpectrogram(
  waveformData: WaveformData | null,
  freqMin?: number,
  freqMax?: number,
): UseSpectrogramResult {
  const [data, setData] = useState<SpectrogramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const computeIdRef = useRef(0);

  useEffect(() => {
    if (!waveformData?.channelData || !waveformData.sampleRate) {
      setData(null);
      return;
    }

    const { channelData, sampleRate, duration } = waveformData;
    const computeId = ++computeIdRef.current;

    setLoading(true);
    setError(null);

    // Try Web Worker first
    let useWorker = true;
    try {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      const worker = new Worker(
        new URL("@/lib/audio/spectrogram-worker.ts", import.meta.url),
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<SpectrogramWorkerOutput>) => {
        if (computeId !== computeIdRef.current) return; // Stale result
        const out = e.data;
        const imageData = createImageData(
          new Uint8ClampedArray(out.buffer),
          out.width,
          out.height,
        );
        setData({
          imageData,
          width: out.width,
          height: out.height,
          duration: out.duration,
          maxFrequency: out.maxFrequency,
          sampleRate: out.sampleRate,
          freqMin: out.freqMin,
          freqMax: out.freqMax,
        });
        setLoading(false);
        worker.terminate();
        workerRef.current = null;
      };

      worker.onerror = (err) => {
        if (computeId !== computeIdRef.current) return;
        console.warn("Spectrogram worker error, falling back to main thread:", err.message);
        worker.terminate();
        workerRef.current = null;
        // Fallback to main thread
        computeOnMainThread(channelData, sampleRate, duration, computeId);
      };

      // Transfer channelData buffer to worker (zero-copy)
      const transferData = new Float32Array(channelData);
      worker.postMessage(
        { channelData: transferData, sampleRate, freqMin, freqMax },
        [transferData.buffer],
      );
    } catch {
      useWorker = false;
    }

    if (!useWorker) {
      computeOnMainThread(channelData, sampleRate, duration, computeId);
    }

    function computeOnMainThread(
      cd: Float32Array,
      sr: number,
      dur: number,
      id: number,
    ) {
      try {
        const nyquist = sr / 2;
        const totalBins = DEFAULT_OPTIONS.fftSize >> 1;
        const result = computeSpectrogram(cd, {
          ...DEFAULT_OPTIONS,
          sampleRate: sr,
          freqMin,
          freqMax,
        });
        if (id !== computeIdRef.current) return;
        const imageData = createImageData(result.imageData, result.width, result.height);
        const actualFreqMin = (result.binMin / totalBins) * nyquist;
        const actualFreqMax = (result.binMax / totalBins) * nyquist;
        setData({
          imageData,
          width: result.width,
          height: result.height,
          duration: dur,
          maxFrequency: nyquist,
          sampleRate: sr,
          freqMin: actualFreqMin,
          freqMax: actualFreqMax,
        });
      } catch (err) {
        if (id !== computeIdRef.current) return;
        setError((err as Error).message ?? "Spectrogram computation failed");
      } finally {
        setLoading(false);
      }
    }

    return () => {
      computeIdRef.current++;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [waveformData, freqMin, freqMax]);

  return { data, loading, error };
}
