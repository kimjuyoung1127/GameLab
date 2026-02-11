"use client";

import { useEffect, useRef, useState } from "react";
import type { WaveformData } from "@/types";

const DOWNSAMPLE_POINTS = 1024;

/**
 * Generate synthetic waveform peaks for mock/fallback display.
 */
function generateSyntheticPeaks(points: number): number[] {
  const peaks: number[] = new Array(points);
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const base = 0.3 + 0.2 * Math.sin(t * Math.PI * 6);
    const noise = Math.random() * 0.3;
    peaks[i] = Math.min(1, base + noise);
  }
  return peaks;
}

/**
 * Decodes an audio source into down-sampled peak data for waveform rendering.
 * Falls back to synthetic peaks when audioUrl is null or fetch fails.
 */
export function useWaveform(
  audioUrl: string | null | undefined,
  fallbackDuration?: number,
) {
  const [data, setData] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);

    // No URL → synthetic fallback
    if (!audioUrl) {
      setData({
        peaks: generateSyntheticPeaks(DOWNSAMPLE_POINTS),
        duration: fallbackDuration ?? 600,
      });
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(audioUrl, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(buf);
        const channelData = decoded.getChannelData(0);
        const peaks = downsample(channelData, DOWNSAMPLE_POINTS);
        setData({
          peaks,
          duration: decoded.duration,
          sampleRate: decoded.sampleRate,
        });
        await audioCtx.close();
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message ?? "Waveform decode failed");
          // Fallback to synthetic peaks on error
          setData({
            peaks: generateSyntheticPeaks(DOWNSAMPLE_POINTS),
            duration: fallbackDuration ?? 600,
          });
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
      abortRef.current = null;
    };
  }, [audioUrl, fallbackDuration]);

  return { data, loading, error };
}

function downsample(channelData: Float32Array, points: number): number[] {
  const blockSize = Math.floor(channelData.length / points);
  if (blockSize === 0) return Array.from(channelData).map(Math.abs);

  const peaks: number[] = new Array(points);
  for (let i = 0; i < points; i++) {
    let max = 0;
    const offset = i * blockSize;
    for (let j = 0; j < blockSize; j++) {
      const v = Math.abs(channelData[offset + j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}
