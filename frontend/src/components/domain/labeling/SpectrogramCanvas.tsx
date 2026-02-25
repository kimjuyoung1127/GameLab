/** 스펙트로그램 캔버스: FFT ImageData를 Canvas에 렌더링하는 배경 컴포넌트. */
"use client";

import { useEffect, useRef } from "react";

import type { SpectrogramData } from "@/types";

interface SpectrogramCanvasProps {
  data: SpectrogramData | null;
  loading: boolean;
  className?: string;
}

export default function SpectrogramCanvas({
  data,
  loading,
  className = "",
}: SpectrogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  function drawToCanvas() {
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Smooth scaling for spectrogram (bicubic-like interpolation)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the offscreen spectrogram scaled to fill the display canvas
    ctx.drawImage(offscreen, 0, 0, w, h);
  }

  useEffect(() => {
    if (!data) return;

    // Create offscreen canvas with spectrogram data at native resolution
    const offscreen = document.createElement("canvas");
    offscreen.width = data.width;
    offscreen.height = data.height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;
    offCtx.putImageData(data.imageData, 0, 0);
    offscreenRef.current = offscreen;

    // Draw scaled to display canvas
    drawToCanvas();
  }, [data]);

  // Resize observer to handle container size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => drawToCanvas());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [data]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ pointerEvents: "none" }}
      />
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            <span>FFT 분석 중...</span>
          </div>
        </div>
      )}
      {/* Fallback gradient when no data and not loading */}
      {!data && !loading && (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-900 to-amber-950 opacity-90" />
      )}
    </div>
  );
}
