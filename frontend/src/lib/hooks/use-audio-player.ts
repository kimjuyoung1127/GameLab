/** 오디오 재생 훅: play/pause/seek, 구간 재생, 볼륨 컨트롤, URL 없으면 시뮬레이션 모드. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  playRegion: (start: number, end: number) => void;
  setVolume: (v: number) => void;
}

/**
 * Audio player with real HTMLAudioElement when URL available,
 * simulated rAF playback when URL is null (mock mode).
 */
export function useAudioPlayer(
  audioUrl: string | null | undefined,
  fallbackDuration?: number,
): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const regionEndRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration ?? 0);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.75;
    const saved = localStorage.getItem("sst-volume");
    return saved !== null ? parseFloat(saved) : 0.75;
  });

  /* ----- Volume setter ----- */
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

  /* ----- Reset on source change ----- */
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(fallbackDuration ?? 0);

    if (!audioUrl) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => {
      // Audio failed to load — fall back to simulated mode
      audioRef.current = null;
      setDuration(fallbackDuration ?? 600);
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
  }, [audioUrl, fallbackDuration]);

  /* ----- Tick loop (real or simulated) ----- */
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Real audio element available → sync from it
    if (audioRef.current) {
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
    } else {
      // Simulated playback via rAF
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (regionEndRef.current !== null && next >= regionEndRef.current) {
            setIsPlaying(false);
            regionEndRef.current = null;
            return regionEndRef.current ?? next;
          }
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, duration]);

  /* ----- Controls ----- */
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      // Simulated mode
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, duration));
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
    },
    [duration],
  );

  const playRegion = useCallback(
    (start: number, end: number) => {
      regionEndRef.current = end;
      seek(start);
      play();
    },
    [seek, play],
  );

  return { isPlaying, currentTime, duration, volume, play, pause, toggle, seek, playRegion, setVolume };
}
