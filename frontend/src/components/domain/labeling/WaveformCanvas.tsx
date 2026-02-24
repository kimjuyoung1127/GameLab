/** 파형 캔버스: Canvas 기반 스펙트로그램 렌더링, 주파수/시간 축, 격자선. */
"use client";

import { useCallback, useEffect, useRef } from "react";

interface WaveformCanvasProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onScrub?: (time: number) => void;
}

const BAR_COLOR = "rgba(99, 102, 241, 0.7)"; // indigo-ish
const BAR_PLAYED_COLOR = "rgba(139, 92, 246, 0.9)"; // violet for played portion
const CURSOR_COLOR = "rgba(255, 255, 255, 0.85)";
const TICK_COLOR = "rgba(255, 255, 255, 0.25)";
const TICK_LABEL_COLOR = "rgba(255, 255, 255, 0.5)";

export default function WaveformCanvas({
  peaks,
  currentTime,
  duration,
  onSeek,
  onScrub,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafSeekRef = useRef<number | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);

  const emitSeek = useCallback((time: number) => {
    onSeek(time);
    onScrub?.(time);
  }, [onScrub, onSeek]);

  // Draw waveform
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const barCount = peaks.length;
    if (barCount === 0 || duration === 0) return;

    const barWidth = w / barCount;
    const playedRatio = currentTime / duration;
    const playedBars = Math.floor(playedRatio * barCount);

    // Draw bars
    for (let i = 0; i < barCount; i++) {
      const amplitude = peaks[i];
      const barH = amplitude * h * 0.85;
      const x = i * barWidth;
      const y = (h - barH) / 2;

      ctx.fillStyle = i <= playedBars ? BAR_PLAYED_COLOR : BAR_COLOR;
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barH);
    }

    // Time ticks (5 divisions)
    ctx.font = "9px ui-monospace, monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const pct = i / 4;
      const x = pct * w;
      ctx.strokeStyle = TICK_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      const t = pct * duration;
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      ctx.fillStyle = TICK_LABEL_COLOR;
      ctx.fillText(label, x, h - 2);
    }

    // Playback cursor
    const cursorX = playedRatio * w;
    ctx.strokeStyle = CURSOR_COLOR;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();

    // Cursor head dot
    ctx.fillStyle = CURSOR_COLOR;
    ctx.beginPath();
    ctx.arc(cursorX, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [peaks, currentTime, duration]);

  // Redraw on every frame while mounted
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  // Handle click-to-seek
  const scheduleSeek = useCallback((time: number) => {
    pendingSeekTimeRef.current = time;
    if (rafSeekRef.current !== null) return;
    rafSeekRef.current = requestAnimationFrame(() => {
      rafSeekRef.current = null;
      const nextTime = pendingSeekTimeRef.current;
      if (nextTime !== null) emitSeek(nextTime);
      pendingSeekTimeRef.current = null;
    });
  }, [emitSeek]);

  const positionToTime = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = rect.width > 0 ? x / rect.width : 0;
    return pct * duration;
  }, [duration]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;
    canvas.setPointerCapture(e.pointerId);
    scheduleSeek(positionToTime(e.clientX));
  }, [duration, positionToTime, scheduleSeek]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.hasPointerCapture(e.pointerId) || duration === 0) return;
    scheduleSeek(positionToTime(e.clientX));
  }, [duration, positionToTime, scheduleSeek]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => () => {
    if (rafSeekRef.current !== null) cancelAnimationFrame(rafSeekRef.current);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-crosshair"
        style={{ display: "block" }}
      />
    </div>
  );
}
