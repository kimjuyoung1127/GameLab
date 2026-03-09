/** 라벨링 confirm/reject/fix 액션 핸들러 + 점수, 업적, 일일 진행, AI 토스트 통합. */
"use client";

import { useCallback, useRef } from "react";
import { enqueueStatusUpdate } from "@/lib/api/action-queue";
import type { Suggestion, SuggestionLlmAssist } from "@/types";

type UseLabelingActionsParams = {
  selectedSuggestionId: string | null;
  suggestions: Suggestion[];
  confirmSuggestion: () => { points: number } | null;
  rejectSuggestion: () => void;
  applyFix: () => { points: number } | null;
  addScore: (points: number) => void;
  addConfirm: () => void;
  addFix: () => void;
  incrementStreak: () => void;
  incrementDailyProgress: () => void;
  checkAndUnlock: () => Promise<void>;
  refreshGamificationSnapshot: () => Promise<void>;
  showToast: (msg: string) => void;
  manualConfirmBlockedMsg: string;
  assistMap?: Record<string, SuggestionLlmAssist>;
  aiToastConfirmAgree?: (params: { confidence: number }) => string;
  aiToastConfirmDisagree?: (params: { aiAction: string }) => string;
  aiToastRejectAgree?: (params: { confidence: number }) => string;
  aiToastRejectDisagree?: (params: { aiAction: string }) => string;
  getActionLabel?: (action: string) => string;
};

export function useLabelingActions({
  selectedSuggestionId,
  suggestions,
  confirmSuggestion,
  rejectSuggestion,
  applyFix,
  addScore,
  addConfirm,
  addFix,
  incrementStreak,
  incrementDailyProgress,
  checkAndUnlock,
  refreshGamificationSnapshot,
  showToast,
  manualConfirmBlockedMsg,
  assistMap,
  aiToastConfirmAgree,
  aiToastConfirmDisagree,
  aiToastRejectAgree,
  aiToastRejectDisagree,
  getActionLabel,
}: UseLabelingActionsParams) {
  const hasInteractedRef = useRef(false);

  const handleConfirm = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    const selected = suggestions.find((s) => s.id === currentId);
    if (!selected || selected.source === "user") {
      showToast(manualConfirmBlockedMsg);
      return;
    }

    const assist = currentId && assistMap ? assistMap[currentId] : undefined;
    const result = confirmSuggestion();
    if (result) {
      addScore(result.points);
      addConfirm();
      incrementStreak();
      incrementDailyProgress();
      if (currentId) enqueueStatusUpdate(currentId, "confirmed");
      void checkAndUnlock();
      void refreshGamificationSnapshot();

      if (assist && aiToastConfirmAgree && aiToastConfirmDisagree && getActionLabel) {
        showToast(
          assist.recommendedAction === "confirm"
            ? aiToastConfirmAgree({ confidence: assist.llmConfidence })
            : aiToastConfirmDisagree({ aiAction: getActionLabel(assist.recommendedAction) }),
        );
      }
    }
  }, [
    selectedSuggestionId, suggestions, confirmSuggestion, addScore, addConfirm,
    incrementStreak, incrementDailyProgress, checkAndUnlock, refreshGamificationSnapshot,
    showToast, manualConfirmBlockedMsg, assistMap, aiToastConfirmAgree, aiToastConfirmDisagree, getActionLabel,
  ]);

  const handleReject = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    const assist = currentId && assistMap ? assistMap[currentId] : undefined;
    rejectSuggestion();
    if (currentId) enqueueStatusUpdate(currentId, "rejected");

    if (assist && aiToastRejectAgree && aiToastRejectDisagree && getActionLabel) {
      showToast(
        assist.recommendedAction === "reject"
          ? aiToastRejectAgree({ confidence: assist.llmConfidence })
          : aiToastRejectDisagree({ aiAction: getActionLabel(assist.recommendedAction) }),
      );
    }
  }, [selectedSuggestionId, rejectSuggestion, assistMap, aiToastRejectAgree, aiToastRejectDisagree, getActionLabel, showToast]);

  const handleApplyFix = useCallback(() => {
    hasInteractedRef.current = true;
    const currentId = selectedSuggestionId;
    const result = applyFix();
    if (result) {
      addScore(result.points);
      addFix();
      incrementStreak();
      incrementDailyProgress();
      if (currentId) enqueueStatusUpdate(currentId, "corrected");
      void checkAndUnlock();
      void refreshGamificationSnapshot();
    }
  }, [applyFix, addScore, addFix, incrementStreak, incrementDailyProgress, selectedSuggestionId, checkAndUnlock, refreshGamificationSnapshot]);

  return {
    hasInteractedRef,
    handleConfirm,
    handleReject,
    handleApplyFix,
  };
}
