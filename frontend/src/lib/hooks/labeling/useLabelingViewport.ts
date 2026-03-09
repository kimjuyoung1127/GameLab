/** 뷰포트 줌/팬/언두: 줌 레벨, 주파수 범위, 뷰포트 스냅샷 되돌리기. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnnotationStore } from "@/lib/store/annotation-store";

type ViewportSnapshot = {
  zoomLevel: number;
  freqMin: number;
  freqMax: number;
  scrollLeft: number;
};

const MAX_FREQ = 20_000;

type UseLabelingViewportParams = {
  effectiveMaxFreq: number;
  totalDuration: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  showToast: (msg: string) => void;
  t: (key: string) => string;
  maxZoom?: number;
  minZoom?: number;
};

export function useLabelingViewport({
  effectiveMaxFreq,
  totalDuration,
  scrollContainerRef,
  showToast,
  t,
  maxZoom = 100,
  minZoom = 1,
}: UseLabelingViewportParams) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [freqMin, setFreqMin] = useState(0);
  const [freqMax, setFreqMax] = useState(MAX_FREQ);
  const [zoomBoxMode, setZoomBoxMode] = useState(false);
  const viewportUndoRef = useRef<ViewportSnapshot[]>([]);

  // freq clamping
  useEffect(() => {
    const clampedMax = Math.min(Math.max(freqMax, 1), effectiveMaxFreq);
    const clampedMin = Math.max(0, Math.min(freqMin, Math.max(clampedMax - 1, 0)));
    if (clampedMin !== freqMin) setFreqMin(clampedMin);
    if (clampedMax !== freqMax) setFreqMax(clampedMax);
  }, [effectiveMaxFreq, freqMin, freqMax]);

  const handleZoomLevelChange = useCallback(
    (updater: (current: number) => number) => {
      viewportUndoRef.current.push({
        zoomLevel,
        freqMin,
        freqMax,
        scrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
      });
      setZoomLevel((current) => updater(current));
    },
    [freqMax, freqMin, zoomLevel, scrollContainerRef],
  );

  const handleZoomToBox = useCallback(
    (box: { startTime: number; endTime: number; freqLow: number; freqHigh: number }) => {
      const rawDuration = box.endTime - box.startTime;
      const rawFreqRange = box.freqHigh - box.freqLow;
      if (rawDuration < 0.05 || rawFreqRange < 100) {
        showToast(t("zoomBoxTooSmall"));
        setZoomBoxMode(false);
        return;
      }
      const boxDuration = Math.max(rawDuration, 0.01);
      const desiredZoom = Math.min(maxZoom, Math.max(minZoom, totalDuration / boxDuration));
      const nextFreqMin = Math.max(0, box.freqLow);
      const nextFreqMax = Math.min(effectiveMaxFreq, box.freqHigh);
      if (nextFreqMax - nextFreqMin < 100) {
        showToast(t("zoomBoxTooSmall"));
        setZoomBoxMode(false);
        return;
      }

      viewportUndoRef.current.push({
        zoomLevel,
        freqMin,
        freqMax,
        scrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
      });

      setZoomLevel(desiredZoom);
      setFreqMin(nextFreqMin);
      setFreqMax(nextFreqMax);
      setZoomBoxMode(false);
      showToast(t("zoomBoxApplied"));

      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container || totalDuration <= 0) return;
        const centerRatio = ((box.startTime + box.endTime) / 2) / totalDuration;
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        const target = centerRatio * container.scrollWidth - container.clientWidth / 2;
        container.scrollLeft = Math.max(0, Math.min(target, maxScrollLeft));
      });
    },
    [effectiveMaxFreq, freqMax, freqMin, showToast, t, totalDuration, zoomLevel, scrollContainerRef, maxZoom, minZoom],
  );

  const handleUndoAllEdits = useCallback(() => {
    const stack = viewportUndoRef.current;
    const hadViewport = stack.length > 0;
    const viewportFirst = stack[0];
    viewportUndoRef.current = [];

    while (useAnnotationStore.getState().undoStack.length > 0) {
      useAnnotationStore.getState().undo();
    }

    if (hadViewport && viewportFirst) {
      setZoomLevel(viewportFirst.zoomLevel);
      setFreqMin(viewportFirst.freqMin);
      setFreqMax(viewportFirst.freqMax);
    } else {
      setZoomLevel(1);
      setFreqMin(0);
      setFreqMax(effectiveMaxFreq);
    }
    setZoomBoxMode(false);

    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (hadViewport && viewportFirst) {
        const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
        container.scrollLeft = Math.max(0, Math.min(viewportFirst.scrollLeft, maxScrollLeft));
      } else {
        container.scrollLeft = 0;
      }
    });
    showToast(hadViewport ? t("zoomRestored") : t("allChangesReverted"));
  }, [effectiveMaxFreq, showToast, t, scrollContainerRef]);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setFreqMin(0);
    setFreqMax(effectiveMaxFreq);
    setZoomBoxMode(false);
    viewportUndoRef.current = [];
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollLeft = 0;
    });
    showToast(t("viewReset"));
  }, [effectiveMaxFreq, showToast, t, scrollContainerRef]);

  const clearViewportUndo = useCallback(() => {
    viewportUndoRef.current = [];
  }, []);

  return {
    zoomLevel,
    setZoomLevel,
    freqMin,
    setFreqMin,
    freqMax,
    setFreqMax,
    zoomBoxMode,
    setZoomBoxMode,
    handleZoomLevelChange,
    handleZoomToBox,
    handleUndoAllEdits,
    handleResetView,
    clearViewportUndo,
  };
}
