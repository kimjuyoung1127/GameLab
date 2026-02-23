/** Action handlers for confirm/reject/fix with score updates and queue sync. */
"use client";

import { useCallback, useRef } from "react";
import { enqueueStatusUpdate } from "@/lib/api/action-queue";

type UseLabelingActionsParams = {
  selectedSuggestionId: string | null;
  confirmSuggestion: () => { points: number } | null;
  rejectSuggestion: () => void;
  applyFix: () => { points: number } | null;
  addScore: (points: number) => void;
  addConfirm: () => void;
  addFix: () => void;
  incrementStreak: () => void;
};

export function useLabelingActions({
  selectedSuggestionId,
  confirmSuggestion,
  rejectSuggestion,
  applyFix,
  addScore,
  addConfirm,
  addFix,
  incrementStreak,
}: UseLabelingActionsParams) {
  const hasInteractedRef = useRef(false);

  const handleConfirm = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    const result = confirmSuggestion();
    if (result) {
      addScore(result.points);
      addConfirm();
      incrementStreak();
      if (currentId) enqueueStatusUpdate(currentId, "confirmed");
    }
  }, [addConfirm, addScore, confirmSuggestion, incrementStreak, selectedSuggestionId]);

  const handleReject = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    rejectSuggestion();
    if (currentId) enqueueStatusUpdate(currentId, "rejected");
  }, [rejectSuggestion, selectedSuggestionId]);

  const handleApplyFix = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    const result = applyFix();
    if (result) {
      addScore(result.points);
      addFix();
      incrementStreak();
      if (currentId) enqueueStatusUpdate(currentId, "corrected");
    }
  }, [addFix, addScore, applyFix, incrementStreak, selectedSuggestionId]);

  return {
    hasInteractedRef,
    handleConfirm,
    handleReject,
    handleApplyFix,
  };
}
