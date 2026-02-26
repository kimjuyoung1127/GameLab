/** Suggestion interaction hook for moving/resizing/deleting user-created suggestions. */
import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { endpoints } from "@/lib/api/endpoints";
import { authFetch } from "@/lib/api/auth-fetch";
import type { ActionType, DrawTool, Suggestion } from "@/types";

type ResizeHandle = "nw" | "ne" | "sw" | "se";

const MIN_DRAFT_DURATION = 0.05;
const MIN_DRAFT_FREQ_RANGE = 100;

type UseSuggestionInteractionsArgs = {
  tool: DrawTool;
  totalDuration: number;
  snapEnabled: boolean;
  freqMin: number;
  freqMax: number;
  effectiveMaxFreqRef: React.RefObject<number>;
  spectrogramRef: React.RefObject<HTMLDivElement | null>;
  updateSuggestion: (id: string, patch: Partial<Suggestion>, options?: { trackHistory?: boolean }) => void;
  selectSuggestion: (id: string | null) => void;
  deleteSuggestion: (id: string) => void;
  pushHistory: (type: ActionType, summary: string, payload?: { time?: number; loopStart?: number | null; loopEnd?: number | null }) => void;
  suggestions: Suggestion[];
  selectedSuggestionId: string | null;
  showToast: (message: string) => void;
  t: (key: string) => string;
  undo: () => void;
};

export function useSuggestionInteractions({
  tool,
  totalDuration,
  snapEnabled,
  freqMin,
  freqMax,
  effectiveMaxFreqRef,
  spectrogramRef,
  updateSuggestion,
  selectSuggestion,
  deleteSuggestion,
  pushHistory,
  suggestions,
  selectedSuggestionId,
  showToast,
  t,
  undo,
}: UseSuggestionInteractionsArgs) {
  const [isDraggingSuggestion, setIsDraggingSuggestion] = useState(false);
  const [isResizingSuggestion, setIsResizingSuggestion] = useState(false);
  const freqRange = Math.max(1, freqMax - freqMin);
  const minFreqSpan = Math.min(MIN_DRAFT_FREQ_RANGE, freqRange);

  const dragSugRef = useRef<{
    suggestionId: string;
    pointerId: number;
    pointerStartX: number;
    pointerStartY: number;
    startTime: number;
    endTime: number;
    freqLow: number;
    freqHigh: number;
  } | null>(null);
  const dragSugRafRef = useRef<number | null>(null);
  const pendingSugDragPatchRef = useRef<{ id: string; patch: Partial<Suggestion> } | null>(null);
  const hasMovedSuggestionRef = useRef(false);

  const resizeSugRef = useRef<{
    suggestionId: string;
    pointerId: number;
    handle: ResizeHandle;
    pointerStartX: number;
    pointerStartY: number;
    startTime: number;
    endTime: number;
    freqLow: number;
    freqHigh: number;
  } | null>(null);
  const resizeSugRafRef = useRef<number | null>(null);
  const pendingSugResizePatchRef = useRef<{ id: string; patch: Partial<Suggestion> } | null>(null);
  const hasResizedSuggestionRef = useRef(false);

  const scheduleSugMove = useCallback(
    (id: string, patch: Partial<Suggestion>) => {
      hasMovedSuggestionRef.current = true;
      pendingSugDragPatchRef.current = { id, patch };
      if (dragSugRafRef.current !== null) return;
      dragSugRafRef.current = requestAnimationFrame(() => {
        dragSugRafRef.current = null;
        if (!pendingSugDragPatchRef.current) return;
        const { id: sId, patch: nextPatch } = pendingSugDragPatchRef.current;
        updateSuggestion(sId, nextPatch);
        pendingSugDragPatchRef.current = null;
      });
    },
    [updateSuggestion],
  );

  const handleSugDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, sug: Suggestion) => {
      if (tool !== "select" || isResizingSuggestion || sug.source !== "user") return;
      e.preventDefault();
      e.stopPropagation();
      selectSuggestion(sug.id);
      if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
      updateSuggestion(sug.id, {}, { trackHistory: true });
      hasMovedSuggestionRef.current = false;
      dragSugRef.current = {
        suggestionId: sug.id,
        pointerId: e.pointerId,
        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        startTime: sug.startTime,
        endTime: sug.endTime,
        freqLow: sug.freqLow,
        freqHigh: sug.freqHigh,
      };
      setIsDraggingSuggestion(true);
    },
    [isResizingSuggestion, selectSuggestion, tool, updateSuggestion],
  );

  const handleSugDragPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragSugRef.current;
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
      const freqDelta = (-dy / Math.max(rect.height, 1)) * freqRange;
      const maxStart = Math.max(0, totalDuration - boxDuration);
      let startTime = Math.max(0, Math.min(drag.startTime + timeDelta, maxStart));
      let freqLow = Math.max(freqMin, Math.min(drag.freqLow + freqDelta, freqMax - boxFreqRange));
      if (snapEnabled) {
        startTime = Math.round(startTime * 10) / 10;
        freqLow = Math.round(freqLow / 100) * 100;
        startTime = Math.max(0, Math.min(startTime, maxStart));
        freqLow = Math.max(freqMin, Math.min(freqLow, freqMax - boxFreqRange));
      }
      const endTime = Math.min(totalDuration, startTime + boxDuration);
      const freqHigh = Math.min(freqMax, freqLow + boxFreqRange);
      scheduleSugMove(drag.suggestionId, { startTime, endTime, freqLow, freqHigh });
    },
    [freqMax, freqMin, freqRange, scheduleSugMove, snapEnabled, spectrogramRef, totalDuration],
  );

  const handleSugDragPointerUp = useCallback(
    async (e: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragSugRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      e.preventDefault();
      if (hasMovedSuggestionRef.current) {
        pushHistory("suggestion_edit", "Moved saved suggestion");
        const sug = suggestions.find((s) => s.id === drag.suggestionId);
        if (sug) {
          try {
            const res = await authFetch(endpoints.labeling.updateSuggestion(sug.id), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startTime: sug.startTime,
                endTime: sug.endTime,
                freqLow: sug.freqLow,
                freqHigh: sug.freqHigh,
              }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          } catch {
            showToast(t("suggestionEditFailed"));
            undo();
          }
        }
      }
      pendingSugDragPatchRef.current = null;
      hasMovedSuggestionRef.current = false;
      dragSugRef.current = null;
      setIsDraggingSuggestion(false);
    },
    [pushHistory, showToast, suggestions, t, undo],
  );

  const scheduleSugResize = useCallback(
    (id: string, patch: Partial<Suggestion>) => {
      hasResizedSuggestionRef.current = true;
      pendingSugResizePatchRef.current = { id, patch };
      if (resizeSugRafRef.current !== null) return;
      resizeSugRafRef.current = requestAnimationFrame(() => {
        resizeSugRafRef.current = null;
        if (!pendingSugResizePatchRef.current) return;
        const { id: sId, patch: nextPatch } = pendingSugResizePatchRef.current;
        updateSuggestion(sId, nextPatch);
        pendingSugResizePatchRef.current = null;
      });
    },
    [updateSuggestion],
  );

  const handleSugResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, sug: Suggestion, handle: ResizeHandle) => {
      if (tool !== "select" || sug.source !== "user") return;
      e.preventDefault();
      e.stopPropagation();
      selectSuggestion(sug.id);
      if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
      updateSuggestion(sug.id, {}, { trackHistory: true });
      hasResizedSuggestionRef.current = false;
      resizeSugRef.current = {
        suggestionId: sug.id,
        pointerId: e.pointerId,
        handle,
        pointerStartX: e.clientX,
        pointerStartY: e.clientY,
        startTime: sug.startTime,
        endTime: sug.endTime,
        freqLow: sug.freqLow,
        freqHigh: sug.freqHigh,
      };
      setIsResizingSuggestion(true);
    },
    [selectSuggestion, tool, updateSuggestion],
  );

  const handleSugResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeSugRef.current;
      if (!resize || resize.pointerId !== e.pointerId) return;
      e.preventDefault();
      const area = spectrogramRef.current;
      if (!area || totalDuration <= 0) return;
      const rect = area.getBoundingClientRect();
      const dx = e.clientX - resize.pointerStartX;
      const dy = e.clientY - resize.pointerStartY;
      const timeDelta = (dx / Math.max(rect.width, 1)) * totalDuration;
      const freqDelta = (-dy / Math.max(rect.height, 1)) * freqRange;
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
        if (resize.handle === "nw" || resize.handle === "sw") nextStart = nextEnd - MIN_DRAFT_DURATION;
        else nextEnd = nextStart + MIN_DRAFT_DURATION;
      }
      nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
      nextEnd = Math.max(nextStart + MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));
      nextLow = Math.max(freqMin, Math.min(nextLow, freqMax - minFreqSpan));
      nextHigh = Math.max(freqMin + minFreqSpan, Math.min(nextHigh, freqMax));
      if (nextHigh - nextLow < minFreqSpan) {
        if (resize.handle === "nw" || resize.handle === "ne") nextHigh = nextLow + minFreqSpan;
        else nextLow = nextHigh - minFreqSpan;
      }
      nextLow = Math.max(freqMin, Math.min(nextLow, freqMax - minFreqSpan));
      nextHigh = Math.max(nextLow + minFreqSpan, Math.min(nextHigh, freqMax));
      if (snapEnabled) {
        nextStart = Math.round(nextStart * 10) / 10;
        nextEnd = Math.round(nextEnd * 10) / 10;
        nextLow = Math.round(nextLow / 100) * 100;
        nextHigh = Math.round(nextHigh / 100) * 100;
        nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
        nextEnd = Math.max(nextStart + MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));
        nextLow = Math.max(freqMin, Math.min(nextLow, freqMax - minFreqSpan));
        nextHigh = Math.max(nextLow + minFreqSpan, Math.min(nextHigh, freqMax));
      }
      scheduleSugResize(resize.suggestionId, {
        startTime: nextStart,
        endTime: nextEnd,
        freqLow: nextLow,
        freqHigh: nextHigh,
      });
    },
    [freqMax, freqMin, freqRange, minFreqSpan, scheduleSugResize, snapEnabled, spectrogramRef, totalDuration],
  );

  const handleSugResizePointerUp = useCallback(
    async (e: React.PointerEvent<HTMLDivElement>) => {
      const resize = resizeSugRef.current;
      if (!resize || resize.pointerId !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      e.preventDefault();
      if (hasResizedSuggestionRef.current) {
        pushHistory("suggestion_edit", "Resized saved suggestion");
        const sug = suggestions.find((s) => s.id === resize.suggestionId);
        if (sug) {
          try {
            const res = await authFetch(endpoints.labeling.updateSuggestion(sug.id), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startTime: sug.startTime,
                endTime: sug.endTime,
                freqLow: sug.freqLow,
                freqHigh: sug.freqHigh,
              }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          } catch {
            showToast(t("suggestionEditFailed"));
            undo();
          }
        }
      }
      pendingSugResizePatchRef.current = null;
      hasResizedSuggestionRef.current = false;
      resizeSugRef.current = null;
      setIsResizingSuggestion(false);
    },
    [pushHistory, showToast, suggestions, t, undo],
  );

  const handleDeleteSelectedSuggestion = useCallback(async () => {
    if (!selectedSuggestionId) return;
    const sug = suggestions.find((s) => s.id === selectedSuggestionId);
    if (!sug || sug.source !== "user") {
      showToast(t("suggestionDeleteBlockedAI"));
      return;
    }
    deleteSuggestion(selectedSuggestionId);
    try {
      const res = await authFetch(endpoints.labeling.deleteSuggestion(selectedSuggestionId), { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      showToast(t("suggestionDeleted"));
    } catch {
      showToast(t("suggestionDeleteFailed"));
      undo();
    }
  }, [deleteSuggestion, selectedSuggestionId, showToast, suggestions, t, undo]);

  useEffect(
    () => () => {
      if (dragSugRafRef.current !== null) cancelAnimationFrame(dragSugRafRef.current);
      if (resizeSugRafRef.current !== null) cancelAnimationFrame(resizeSugRafRef.current);
    },
    [],
  );

  return {
    isDraggingSuggestion,
    isResizingSuggestion,
    handleSugDragPointerDown,
    handleSugDragPointerMove,
    handleSugDragPointerUp,
    handleSugResizePointerDown,
    handleSugResizePointerMove,
    handleSugResizePointerUp,
    handleDeleteSelectedSuggestion,
  };
}
