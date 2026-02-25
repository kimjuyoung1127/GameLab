/** Draft interaction hook for creating, moving, and resizing manual draft boxes. */
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import type { ActionType, DrawTool, ManualDraft } from "@/types";

type ResizeHandle = "nw" | "ne" | "sw" | "se";

const MIN_DRAFT_DURATION = 0.05;
const MIN_DRAFT_FREQ_RANGE = 100;

type UseDraftInteractionsArgs = {
  activeFileId: string | null;
  tool: DrawTool;
  totalDuration: number;
  snapEnabled: boolean;
  effectiveMaxFreqRef: React.RefObject<number>;
  spectrogramRef: React.RefObject<HTMLDivElement | null>;
  isDraggingSuggestion: boolean;
  isResizingSuggestion: boolean;
  seekTo: (time: number, trackHistory?: boolean) => void;
  t: (key: string) => string;
  startDraft: (input: Omit<ManualDraft, "id" | "source">) => void;
  updateDraft: (id: string, patch: Partial<ManualDraft>, options?: { trackHistory?: boolean }) => void;
  selectDraft: (id: string | null) => void;
  pushHistory: (type: ActionType, summary: string, payload?: { time?: number; loopStart?: number | null; loopEnd?: number | null }) => void;
};

export function useDraftInteractions({
  activeFileId,
  tool,
  totalDuration,
  snapEnabled,
  effectiveMaxFreqRef,
  spectrogramRef,
  isDraggingSuggestion,
  isResizingSuggestion,
  seekTo,
  t,
  startDraft,
  updateDraft,
  selectDraft,
  pushHistory,
}: UseDraftInteractionsArgs) {
  const [isDrawingDraft, setIsDrawingDraft] = useState(false);
  const [draftPreview, setDraftPreview] = useState<ManualDraft | null>(null);
  const [isDraggingDraft, setIsDraggingDraft] = useState(false);
  const [isResizingDraft, setIsResizingDraft] = useState(false);

  const draftPointerRef = useRef<{ audioId: string; startTime: number; startFreq: number } | null>(null);
  const draftUpdateRafRef = useRef<number | null>(null);
  const pendingPreviewRef = useRef<ManualDraft | null>(null);

  const dragDraftRef = useRef<{
    draftId: string;
    pointerId: number;
    pointerStartX: number;
    pointerStartY: number;
    startTime: number;
    endTime: number;
    freqLow: number;
    freqHigh: number;
  } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPatchRef = useRef<{ id: string; patch: Partial<ManualDraft> } | null>(null);
  const hasMovedDraftRef = useRef(false);

  const resizeDraftRef = useRef<{
    draftId: string;
    pointerId: number;
    handle: ResizeHandle;
    pointerStartX: number;
    pointerStartY: number;
    startTime: number;
    endTime: number;
    freqLow: number;
    freqHigh: number;
  } | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const pendingResizePatchRef = useRef<{ id: string; patch: Partial<ManualDraft> } | null>(null);
  const hasResizedDraftRef = useRef(false);

  const handleScrubFromSpectrogram = useCallback(
    (clientX: number) => {
      const area = spectrogramRef.current;
      if (!area || totalDuration <= 0) return;
      const rect = area.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = rect.width > 0 ? x / rect.width : 0;
      seekTo(ratio * totalDuration, false);
    },
    [seekTo, spectrogramRef, totalDuration],
  );

  const pointerToDomain = useCallback(
    (clientX: number, clientY: number) => {
      const area = spectrogramRef.current;
      if (!area || totalDuration <= 0) return null;
      const rect = area.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
      const time = (x / Math.max(rect.width, 1)) * totalDuration;
      const mf = effectiveMaxFreqRef.current;
      const freq = mf * (1 - y / Math.max(rect.height, 1));
      return { time, freq };
    },
    [effectiveMaxFreqRef, spectrogramRef, totalDuration],
  );

  const handleDraftPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activeFileId) return;
      if (isDraggingDraft || isResizingDraft || isDraggingSuggestion || isResizingSuggestion) return;
      if (tool !== "box") {
        handleScrubFromSpectrogram(e.clientX);
        return;
      }
      const mapped = pointerToDomain(e.clientX, e.clientY);
      if (!mapped) return;
      const snapTime = snapEnabled ? Math.round(mapped.time * 10) / 10 : mapped.time;
      const snapFreq = snapEnabled ? Math.round(mapped.freq / 100) * 100 : mapped.freq;
      const preview: ManualDraft = {
        id: "draft-preview",
        audioId: activeFileId,
        label: t("manualDefaultLabel"),
        description: t("manualDefaultDescription"),
        startTime: snapTime,
        endTime: snapTime + 0.05,
        freqLow: Math.max(0, snapFreq - 100),
        freqHigh: Math.min(effectiveMaxFreqRef.current, snapFreq + 100),
        source: "user",
      };
      setDraftPreview(preview);
      e.currentTarget.setPointerCapture(e.pointerId);
      draftPointerRef.current = { audioId: activeFileId, startTime: snapTime, startFreq: snapFreq };
      setIsDrawingDraft(true);
    },
    [
      activeFileId,
      effectiveMaxFreqRef,
      handleScrubFromSpectrogram,
      isDraggingDraft,
      isDraggingSuggestion,
      isResizingDraft,
      isResizingSuggestion,
      pointerToDomain,
      snapEnabled,
      t,
      tool,
    ],
  );

  const scheduleDraftPreview = useCallback((next: ManualDraft) => {
    pendingPreviewRef.current = next;
    if (draftUpdateRafRef.current !== null) return;
    draftUpdateRafRef.current = requestAnimationFrame(() => {
      draftUpdateRafRef.current = null;
      if (pendingPreviewRef.current) {
        setDraftPreview(pendingPreviewRef.current);
      }
      pendingPreviewRef.current = null;
    });
  }, []);

  const handleDraftPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDrawingDraft || !draftPointerRef.current) return;
      const mapped = pointerToDomain(e.clientX, e.clientY);
      if (!mapped) return;
      const { audioId, startTime, startFreq } = draftPointerRef.current;
      const curTime = snapEnabled ? Math.round(mapped.time * 10) / 10 : mapped.time;
      const curFreq = snapEnabled ? Math.round(mapped.freq / 100) * 100 : mapped.freq;
      scheduleDraftPreview({
        id: "draft-preview",
        audioId,
        label: t("manualDefaultLabel"),
        description: t("manualDefaultDescription"),
        startTime: Math.min(startTime, curTime),
        endTime: Math.max(startTime, curTime),
        freqLow: Math.max(0, Math.min(startFreq, curFreq)),
        freqHigh: Math.min(effectiveMaxFreqRef.current, Math.max(startFreq, curFreq)),
        source: "user",
      });
    },
    [effectiveMaxFreqRef, isDrawingDraft, pointerToDomain, scheduleDraftPreview, snapEnabled, t],
  );

  const handleDraftPointerUp = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (e?.currentTarget && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (draftPreview) {
        startDraft({
          audioId: draftPreview.audioId,
          label: draftPreview.label,
          description: draftPreview.description,
          startTime: draftPreview.startTime,
          endTime: draftPreview.endTime,
          freqLow: draftPreview.freqLow,
          freqHigh: draftPreview.freqHigh,
        });
      }
      setDraftPreview(null);
      draftPointerRef.current = null;
      pendingPreviewRef.current = null;
      setIsDrawingDraft(false);
    },
    [draftPreview, startDraft],
  );

  const scheduleDraftMove = useCallback(
    (id: string, patch: Partial<ManualDraft>) => {
      hasMovedDraftRef.current = true;
      pendingDragPatchRef.current = { id, patch };
      if (dragRafRef.current !== null) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (!pendingDragPatchRef.current) return;
        const { id: draftId, patch: nextPatch } = pendingDragPatchRef.current;
        updateDraft(draftId, nextPatch);
        pendingDragPatchRef.current = null;
      });
    },
    [updateDraft],
  );

  const handleDraftDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, draft: ManualDraft) => {
      if (tool !== "select" || isResizingDraft) return;
      e.preventDefault();
      e.stopPropagation();
      selectDraft(draft.id);
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      updateDraft(draft.id, {}, { trackHistory: true });
      hasMovedDraftRef.current = false;
      dragDraftRef.current = {
        draftId: draft.id,
        pointerId: e.pointerId,
        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        startTime: draft.startTime,
        endTime: draft.endTime,
        freqLow: draft.freqLow,
        freqHigh: draft.freqHigh,
      };
      setIsDraggingDraft(true);
    },
    [isResizingDraft, selectDraft, tool, updateDraft],
  );

  const handleDraftDragPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragDraftRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.preventDefault();
      const area = spectrogramRef.current;
      if (!area || totalDuration <= 0) return;
      const rect = area.getBoundingClientRect();
      const dx = e.clientX - drag.pointerStartX;
      const dy = e.clientY - drag.pointerStartY;

      const boxDuration = Math.max(0.01, drag.endTime - drag.startTime);
      const boxFreqRange = Math.max(1, drag.freqHigh - drag.freqLow);
      const timeDelta = (dx / Math.max(rect.width, 1)) * totalDuration;
      const mf = effectiveMaxFreqRef.current;
      const freqDelta = (-dy / Math.max(rect.height, 1)) * mf;

      const maxStart = Math.max(0, totalDuration - boxDuration);
      let startTime = Math.max(0, Math.min(drag.startTime + timeDelta, maxStart));
      let freqLow = Math.max(0, Math.min(drag.freqLow + freqDelta, mf - boxFreqRange));

      if (snapEnabled) {
        startTime = Math.round(startTime * 10) / 10;
        freqLow = Math.round(freqLow / 100) * 100;
        startTime = Math.max(0, Math.min(startTime, maxStart));
        freqLow = Math.max(0, Math.min(freqLow, mf - boxFreqRange));
      }

      const endTime = Math.min(totalDuration, startTime + boxDuration);
      const freqHigh = Math.min(mf, freqLow + boxFreqRange);

      scheduleDraftMove(drag.draftId, {
        startTime,
        endTime,
        freqLow,
        freqHigh,
      });
    },
    [effectiveMaxFreqRef, scheduleDraftMove, snapEnabled, spectrogramRef, totalDuration],
  );

  const handleDraftDragPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragDraftRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      e.preventDefault();
      if (hasMovedDraftRef.current) {
        pushHistory("manual_move", "Moved manual draft");
      }
      pendingDragPatchRef.current = null;
      hasMovedDraftRef.current = false;
      dragDraftRef.current = null;
      setIsDraggingDraft(false);
    },
    [pushHistory],
  );

  const scheduleDraftResize = useCallback(
    (id: string, patch: Partial<ManualDraft>) => {
      hasResizedDraftRef.current = true;
      pendingResizePatchRef.current = { id, patch };
      if (resizeRafRef.current !== null) return;
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        if (!pendingResizePatchRef.current) return;
        const { id: draftId, patch: nextPatch } = pendingResizePatchRef.current;
        updateDraft(draftId, nextPatch);
        pendingResizePatchRef.current = null;
      });
    },
    [updateDraft],
  );

  const handleDraftResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, draft: ManualDraft, handle: ResizeHandle) => {
      if (tool !== "select") return;
      e.preventDefault();
      e.stopPropagation();
      selectDraft(draft.id);
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      updateDraft(draft.id, {}, { trackHistory: true });
      hasResizedDraftRef.current = false;
      resizeDraftRef.current = {
        draftId: draft.id,
        pointerId: e.pointerId,
        handle,
        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        startTime: draft.startTime,
        endTime: draft.endTime,
        freqLow: draft.freqLow,
        freqHigh: draft.freqHigh,
      };
      setIsResizingDraft(true);
    },
    [selectDraft, tool, updateDraft],
  );

  const handleDraftResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeDraftRef.current;
      if (!resize || resize.pointerId !== e.pointerId) return;
      e.preventDefault();
      const area = spectrogramRef.current;
      if (!area || totalDuration <= 0) return;
      const rect = area.getBoundingClientRect();
      const dx = e.clientX - resize.pointerStartX;
      const dy = e.clientY - resize.pointerStartY;
      const timeDelta = (dx / Math.max(rect.width, 1)) * totalDuration;
      const mf = effectiveMaxFreqRef.current;
      const freqDelta = (-dy / Math.max(rect.height, 1)) * mf;

      let nextStart = resize.startTime;
      let nextEnd = resize.endTime;
      let nextLow = resize.freqLow;
      let nextHigh = resize.freqHigh;

      if (resize.handle === "nw" || resize.handle === "sw") nextStart = resize.startTime + timeDelta;
      if (resize.handle === "ne" || resize.handle === "se") nextEnd = resize.endTime + timeDelta;
      if (resize.handle === "nw" || resize.handle === "ne") nextHigh = resize.freqHigh + freqDelta;
      if (resize.handle === "sw" || resize.handle === "se") nextLow = resize.freqLow + freqDelta;

      nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
      nextEnd = Math.max(MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));
      if (nextEnd - nextStart < MIN_DRAFT_DURATION) {
        if (resize.handle === "nw" || resize.handle === "sw") {
          nextStart = nextEnd - MIN_DRAFT_DURATION;
        } else {
          nextEnd = nextStart + MIN_DRAFT_DURATION;
        }
      }
      nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
      nextEnd = Math.max(nextStart + MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));

      nextLow = Math.max(0, Math.min(nextLow, mf - MIN_DRAFT_FREQ_RANGE));
      nextHigh = Math.max(MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, mf));
      if (nextHigh - nextLow < MIN_DRAFT_FREQ_RANGE) {
        if (resize.handle === "nw" || resize.handle === "ne") {
          nextHigh = nextLow + MIN_DRAFT_FREQ_RANGE;
        } else {
          nextLow = nextHigh - MIN_DRAFT_FREQ_RANGE;
        }
      }
      nextLow = Math.max(0, Math.min(nextLow, mf - MIN_DRAFT_FREQ_RANGE));
      nextHigh = Math.max(nextLow + MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, mf));

      if (snapEnabled) {
        nextStart = Math.round(nextStart * 10) / 10;
        nextEnd = Math.round(nextEnd * 10) / 10;
        nextLow = Math.round(nextLow / 100) * 100;
        nextHigh = Math.round(nextHigh / 100) * 100;
        nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
        nextEnd = Math.max(nextStart + MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));
        nextLow = Math.max(0, Math.min(nextLow, mf - MIN_DRAFT_FREQ_RANGE));
        nextHigh = Math.max(nextLow + MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, mf));
      }

      scheduleDraftResize(resize.draftId, {
        startTime: nextStart,
        endTime: nextEnd,
        freqLow: nextLow,
        freqHigh: nextHigh,
      });
    },
    [effectiveMaxFreqRef, scheduleDraftResize, snapEnabled, spectrogramRef, totalDuration],
  );

  const handleDraftResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeDraftRef.current;
      if (!resize || resize.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      e.preventDefault();
      if (hasResizedDraftRef.current) {
        pushHistory("manual_resize", "Resized manual draft");
      }
      pendingResizePatchRef.current = null;
      hasResizedDraftRef.current = false;
      resizeDraftRef.current = null;
      setIsResizingDraft(false);
    },
    [pushHistory],
  );

  useEffect(
    () => () => {
      if (draftUpdateRafRef.current !== null) cancelAnimationFrame(draftUpdateRafRef.current);
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
      if (resizeRafRef.current !== null) cancelAnimationFrame(resizeRafRef.current);
    },
    [],
  );

  return {
    isDrawingDraft,
    draftPreview,
    isDraggingDraft,
    isResizingDraft,
    handleDraftPointerDown,
    handleDraftPointerMove,
    handleDraftPointerUp,
    handleDraftDragPointerDown,
    handleDraftDragPointerMove,
    handleDraftDragPointerUp,
    handleDraftResizePointerDown,
    handleDraftResizePointerMove,
    handleDraftResizePointerUp,
  };
}
