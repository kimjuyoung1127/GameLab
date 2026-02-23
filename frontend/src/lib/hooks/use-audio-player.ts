/** Audio player hook: real HTMLAudioElement only, with explicit error state. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  canPlay: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  playRegion: (start: number, end: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
}

export function useAudioPlayer(
  audioUrl: string | null | undefined,
  fallbackDuration?: number,
  retryKey = 0,
): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const regionEndRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.75;
    const saved = localStorage.getItem("sst-volume");
    return saved !== null ? parseFloat(saved) : 0.75;
  });
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const resetPlayerState = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(fallbackDuration ?? 0);
    setError(null);
    setCanPlay(false);
  }, [fallbackDuration]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("sst-volume", String(clamped));
    }
  }, []);

  const setPlaybackRate = useCallback((r: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, r));
    setPlaybackRateState(clamped);
    if (audioRef.current) {
      audioRef.current.playbackRate = clamped;
    }
  }, []);

  useEffect(() => {
    // Source change must clear stale playback state before attaching a new element.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetPlayerState();

    if (!audioUrl) {
      audioRef.current = null;
      setError("Audio URL is missing");
      return;
    }

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration);
      setCanPlay(true);
      setError(null);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => {
      setCanPlay(false);
      setError("Audio failed to load");
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
  }, [audioUrl, playbackRate, resetPlayerState, retryKey, volume]);

  useEffect(() => {
    if (!isPlaying || !audioRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        if (regionEndRef.current !== null && t >= regionEndRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          regionEndRef.current = null;
          return;
        }
        setCurrentTime(t);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const play = useCallback(() => {
    if (!audioRef.current || !canPlay) return;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
      setError("Audio playback failed");
    });
  }, [canPlay]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (time: number) => {
      if (!canPlay) return;
      const clamped = Math.max(0, Math.min(time, duration));
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
    },
    [canPlay, duration],
  );

  const playRegion = useCallback(
    (start: number, end: number) => {
      if (!canPlay) return;
      regionEndRef.current = end;
      seek(start);
      play();
    },
    [canPlay, play, seek],
  );

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    canPlay,
    error,
    play,
    pause,
    toggle,
    seek,
    playRegion,
    setVolume,
    setPlaybackRate,
  };
}
