"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FilterConfig, ListeningSelection } from "@/lib/audio/listening-types";

type SegmentPlaybackParams = {
  channelData: Float32Array | null | undefined;
  sampleRate: number | null | undefined;
};

type SegmentPlaybackErrorCode =
  | "NO_AUDIO_DATA"
  | "INVALID_TIME_RANGE"
  | "INVALID_FREQUENCY_RANGE"
  | "EMPTY_SEGMENT"
  | "PLAYBACK_FAILED";

type SegmentPlaybackError = {
  code: SegmentPlaybackErrorCode;
  message: string;
};

class SegmentPlaybackException extends Error {
  code: SegmentPlaybackErrorCode;

  constructor(code: SegmentPlaybackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type SegmentPlaybackController = {
  isPlaying: boolean;
  mode: "original" | "filtered" | null;
  error: SegmentPlaybackError | null;
  stop: () => void;
  playOriginalSegment: (selection: ListeningSelection, rate: number) => Promise<void>;
  playFilteredSegment: (
    selection: ListeningSelection,
    filterConfig: FilterConfig,
    rate: number,
  ) => Promise<void>;
};

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  order: 4,
  normalize: true,
  method: "biquad_chain",
};

function validateSelection(selection: ListeningSelection): SegmentPlaybackError | null {
  if (selection.timeEndSec <= selection.timeStartSec) {
    return { code: "INVALID_TIME_RANGE", message: "Invalid selection time range" };
  }
  if (selection.freqHighHz <= selection.freqLowHz || selection.freqLowHz < 0) {
    return { code: "INVALID_FREQUENCY_RANGE", message: "Invalid selection frequency range" };
  }
  return null;
}

function normalizePeak(data: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) {
    const abs = Math.abs(data[i]);
    if (abs > peak) peak = abs;
  }
  if (peak <= 0 || peak >= 0.99) return data;

  const scaled = new Float32Array(data.length);
  const gain = 0.99 / peak;
  for (let i = 0; i < data.length; i += 1) {
    scaled[i] = data[i] * gain;
  }
  return scaled;
}

export function useSegmentPlayback({
  channelData,
  sampleRate,
}: SegmentPlaybackParams): SegmentPlaybackController {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<"original" | "filtered" | null>(null);
  const [error, setError] = useState<SegmentPlaybackError | null>(null);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
    setMode(null);
  }, []);

  useEffect(() => () => {
    stop();
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, [stop]);

  const ensureAudioContext = useCallback(async (): Promise<AudioContext> => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const getSegmentData = useCallback(
    (selection: ListeningSelection): Float32Array => {
      if (!channelData || !sampleRate) {
        throw new SegmentPlaybackException("NO_AUDIO_DATA", "Audio data is not loaded");
      }

      const validationError = validateSelection(selection);
      if (validationError) {
        throw new SegmentPlaybackException(validationError.code, validationError.message);
      }

      const start = Math.max(0, Math.floor(selection.timeStartSec * sampleRate));
      const end = Math.min(channelData.length, Math.ceil(selection.timeEndSec * sampleRate));
      if (end <= start) {
        throw new SegmentPlaybackException("EMPTY_SEGMENT", "Selected segment is empty");
      }

      return channelData.slice(start, end);
    },
    [channelData, sampleRate],
  );

  const createBufferSource = useCallback(
    async (segmentData: Float32Array, playbackRate: number) => {
      const ctx = await ensureAudioContext();
      const buffer = ctx.createBuffer(1, segmentData.length, sampleRate ?? 44_100);
      buffer.copyToChannel(segmentData, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = Math.max(0.25, Math.min(2.0, playbackRate));
      source.onended = () => {
        if (sourceRef.current === source) {
          sourceRef.current = null;
          setIsPlaying(false);
          setMode(null);
        }
      };
      return { ctx, source };
    },
    [ensureAudioContext, sampleRate],
  );

  const playOriginalSegment = useCallback(
    async (selection: ListeningSelection, rate: number) => {
      try {
        setError(null);
        stop();
        const raw = getSegmentData(selection);
        const { ctx, source } = await createBufferSource(raw, rate);
        source.connect(ctx.destination);
        sourceRef.current = source;
        setIsPlaying(true);
        setMode("original");
        source.start();
      } catch (err) {
        const normalized: SegmentPlaybackError =
          err instanceof SegmentPlaybackException
            ? { code: err.code, message: err.message }
            : { code: "PLAYBACK_FAILED", message: "Original segment playback failed" };
        setError(normalized);
        setIsPlaying(false);
      }
    },
    [createBufferSource, getSegmentData, stop],
  );

  const playFilteredSegment = useCallback(
    async (selection: ListeningSelection, filterConfig: FilterConfig = DEFAULT_FILTER_CONFIG, rate: number) => {
      try {
        setError(null);
        stop();
        const raw = getSegmentData(selection);
        const segment = filterConfig.normalize ? normalizePeak(raw) : raw;
        const { ctx, source } = await createBufferSource(segment, rate);

        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = selection.freqLowHz;
        highpass.Q.value = filterConfig.q ?? 0.707;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = selection.freqHighHz;
        lowpass.Q.value = filterConfig.q ?? 0.707;

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(ctx.destination);

        sourceRef.current = source;
        setIsPlaying(true);
        setMode("filtered");
        source.start();
      } catch (err) {
        const normalized: SegmentPlaybackError =
          err instanceof SegmentPlaybackException
            ? { code: err.code, message: err.message }
            : { code: "PLAYBACK_FAILED", message: "Filtered segment playback failed" };
        setError(normalized);
        setIsPlaying(false);
      }
    },
    [createBufferSource, getSegmentData, stop],
  );

  return {
    isPlaying,
    mode,
    error,
    stop,
    playOriginalSegment,
    playFilteredSegment,
  };
}
