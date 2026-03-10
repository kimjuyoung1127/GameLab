/** Viewport state hook for zoom, frequency range, and viewport undo snapshots. */
"use client";

import { useCallback, useRef, useState } from "react";
import { useAnnotationStore } from "@/lib/store/annotation-store";

type ViewportSnapshot = {
  zoomLevel: number;
  freqMin: number;
  freqMax: number;
  scrollLeft: number;
};

type FrequencyRange = {
  freqMin: number;
  freqMax: number;
};

type NumberStateUpdate = number | ((current: number) => number);

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

function clampFrequencyRange(rawMin: number, rawMax: number, effectiveMaxFreq: number): FrequencyRange {
  const safeMaxFreq = Math.max(1, effectiveMaxFreq);
  const freqMax = Math.min(Math.max(rawMax, 1), safeMaxFreq);
  const freqMin = Math.max(0, Math.min(rawMin, Math.max(freqMax - 1, 0)));
  return { freqMin, freqMax };
}

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
  const [frequencyRange, setFrequencyRange] = useState<FrequencyRange>({
    freqMin: 0,
    freqMax: MAX_FREQ,
  });
  const [zoomBoxMode, setZoomBoxMode] = useState(false);
  const viewportUndoRef = useRef<ViewportSnapshot[]>([]);
  const { freqMin, freqMax } = clampFrequencyRange(
    frequencyRange.freqMin,
    frequencyRange.freqMax,
    effectiveMaxFreq,
  );

  const setFreqRange = useCallback(
    (nextMinInput: NumberStateUpdate, nextMaxInput: NumberStateUpdate) => {
      setFrequencyRange((current) => {
        const currentRange = clampFrequencyRange(current.freqMin, current.freqMax, effectiveMaxFreq);
        const nextMin =
          typeof nextMinInput === "function" ? nextMinInput(currentRange.freqMin) : nextMinInput;
        const nextMax =
          typeof nextMaxInput === "function" ? nextMaxInput(currentRange.freqMax) : nextMaxInput;
        return clampFrequencyRange(nextMin, nextMax, effectiveMaxFreq);
      });
    },
    [effectiveMaxFreq],
  );

  const setFreqMin = useCallback(
    (nextMinInput: NumberStateUpdate) => {
      setFrequencyRange((current) => {
        const currentRange = clampFrequencyRange(current.freqMin, current.freqMax, effectiveMaxFreq);
        const nextMin =
          typeof nextMinInput === "function" ? nextMinInput(currentRange.freqMin) : nextMinInput;
        return clampFrequencyRange(nextMin, currentRange.freqMax, effectiveMaxFreq);
      });
    },
    [effectiveMaxFreq],
  );

  const setFreqMax = useCallback(
    (nextMaxInput: NumberStateUpdate) => {
      setFrequencyRange((current) => {
        const currentRange = clampFrequencyRange(current.freqMin, current.freqMax, effectiveMaxFreq);
        const nextMax =
          typeof nextMaxInput === "function" ? nextMaxInput(currentRange.freqMax) : nextMaxInput;
        return clampFrequencyRange(currentRange.freqMin, nextMax, effectiveMaxFreq);
      });
    },
    [effectiveMaxFreq],
  );

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
    [freqMax, freqMin, scrollContainerRef, zoomLevel],
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
      setFreqRange(nextFreqMin, nextFreqMax);
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
    [
      effectiveMaxFreq,
      freqMax,
      freqMin,
      maxZoom,
      minZoom,
      scrollContainerRef,
      setFreqRange,
      showToast,
      t,
      totalDuration,
      zoomLevel,
    ],
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
      setFreqRange(viewportFirst.freqMin, viewportFirst.freqMax);
    } else {
      setZoomLevel(1);
      setFreqRange(0, effectiveMaxFreq);
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
  }, [effectiveMaxFreq, scrollContainerRef, setFreqRange, showToast, t]);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setFreqRange(0, effectiveMaxFreq);
    setZoomBoxMode(false);
    viewportUndoRef.current = [];
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollLeft = 0;
    });
    showToast(t("viewReset"));
  }, [effectiveMaxFreq, scrollContainerRef, setFreqRange, showToast, t]);

  const clearViewportUndo = useCallback(() => {
    viewportUndoRef.current = [];
  }, []);

  /** Store the current viewport so pointer-based fit changes can be undone with Ctrl+Z. */
  const pushViewportSnapshot = useCallback(() => {
    viewportUndoRef.current.push({
      zoomLevel,
      freqMin,
      freqMax,
      scrollLeft: scrollContainerRef.current?.scrollLeft ?? 0,
    });
  }, [freqMax, freqMin, scrollContainerRef, zoomLevel]);

  /** Restore the latest viewport-only snapshot without touching annotation history. */
  const handleViewportUndo = useCallback(() => {
    const stack = viewportUndoRef.current;
    const snapshot = stack.pop();
    if (!snapshot) return false;
    setZoomLevel(snapshot.zoomLevel);
    setFreqRange(snapshot.freqMin, snapshot.freqMax);
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      container.scrollLeft = Math.max(0, Math.min(snapshot.scrollLeft, maxScrollLeft));
    });
    return true;
  }, [scrollContainerRef, setFreqRange]);

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
    handleViewportUndo,
    pushViewportSnapshot,
    clearViewportUndo,
  };
}
