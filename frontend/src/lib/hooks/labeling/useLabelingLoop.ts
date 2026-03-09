/** 루프 재생: 시작/끝 설정, 토글, HUD 경고, player 동기화. */
"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActionType } from "@/types";

type LoopState = {
  start: number | null;
  end: number | null;
  enabled: boolean;
};

type UseLabelingLoopParams = {
  loopState: LoopState;
  setLoopState: (patch: Partial<LoopState>) => void;
  currentTime: number;
  setLoopStart: (v: number | null) => void;
  setLoopEnd: (v: number | null) => void;
  setLoopEnabled: (v: boolean) => void;
  pushHistory: (type: ActionType, desc: string, payload?: Record<string, unknown>) => void;
  showToast: (msg: string) => void;
  t: (key: string) => string;
};

export function useLabelingLoop({
  loopState,
  setLoopState,
  currentTime,
  setLoopStart,
  setLoopEnd,
  setLoopEnabled,
  pushHistory,
  showToast,
  t,
}: UseLabelingLoopParams) {
  const [loopHudWarning, setLoopHudWarning] = useState(false);

  const handleSetLoopStart = useCallback(() => {
    setLoopState({ start: currentTime });
    pushHistory("loop_set", `Loop start ${currentTime.toFixed(2)}s`, {
      loopStart: currentTime,
      loopEnd: loopState.end,
    });
  }, [currentTime, pushHistory, setLoopState, loopState.end]);

  const handleSetLoopEnd = useCallback(() => {
    setLoopState({ end: currentTime });
    pushHistory("loop_set", `Loop end ${currentTime.toFixed(2)}s`, {
      loopStart: loopState.start,
      loopEnd: currentTime,
    });
  }, [currentTime, pushHistory, setLoopState, loopState.start]);

  const handleToggleLoop = useCallback(() => {
    if (loopState.start === null || loopState.end === null || loopState.end <= loopState.start) {
      showToast(t("loopRequireBounds"));
      setLoopHudWarning(true);
      return;
    }
    setLoopHudWarning(false);
    setLoopState({ enabled: !loopState.enabled });
    showToast(loopState.enabled ? t("loopDisabled") : t("loopEnabled"));
  }, [loopState, setLoopState, showToast, t]);

  // HUD warning auto-dismiss
  useEffect(() => {
    if (!loopHudWarning) return;
    const timer = setTimeout(() => setLoopHudWarning(false), 1600);
    return () => clearTimeout(timer);
  }, [loopHudWarning]);

  // Sync loop state → player
  useEffect(() => {
    setLoopStart(loopState.start);
    setLoopEnd(loopState.end);
    setLoopEnabled(loopState.enabled);
  }, [loopState, setLoopStart, setLoopEnd, setLoopEnabled]);

  return {
    loopHudWarning,
    handleSetLoopStart,
    handleSetLoopEnd,
    handleToggleLoop,
  };
}
