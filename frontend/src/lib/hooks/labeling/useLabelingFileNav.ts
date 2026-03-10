/** File navigation hook for click/prev/next actions and completion-driven auto advance. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioFile } from "@/types";

type UseLabelingFileNavParams = {
  activeFileId: string | null;
  audioFiles: AudioFile[];
  setCurrentFile: (id: string) => void;
  navigateToSessions: () => void;
  hasInteractedRef: React.RefObject<boolean>;
  pendingCount: number;
  totalCount: number;
  onFileChange?: () => void;
};

export function useLabelingFileNav({
  activeFileId,
  audioFiles,
  setCurrentFile,
  navigateToSessions,
  hasInteractedRef,
  pendingCount,
  totalCount,
  onFileChange,
}: UseLabelingFileNavParams) {
  const [completionToastFileId, setCompletionToastFileId] = useState<string | null>(null);
  const completionHandled = useRef(false);
  const completionRafRef = useRef<number | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastFile = (() => {
    if (!activeFileId) return true;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    return idx >= audioFiles.length - 1;
  })();

  const fileCompleteToast = completionToastFileId !== null && completionToastFileId === activeFileId;

  const clearCompletionSchedule = useCallback(() => {
    if (completionRafRef.current !== null) {
      cancelAnimationFrame(completionRafRef.current);
      completionRafRef.current = null;
    }
    if (completionTimerRef.current !== null) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const handleFileClick = useCallback((file: AudioFile) => {
    setCurrentFile(file.id);
  }, [setCurrentFile]);

  const handleNextFile = useCallback(() => {
    if (!activeFileId) return;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    const nextFile = audioFiles[idx + 1];
    if (nextFile) {
      setCurrentFile(nextFile.id);
    } else {
      navigateToSessions();
    }
  }, [activeFileId, audioFiles, navigateToSessions, setCurrentFile]);

  const handlePrevFile = useCallback(() => {
    if (!activeFileId) return;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    const prevFile = audioFiles[idx - 1];
    if (prevFile) {
      setCurrentFile(prevFile.id);
    }
  }, [activeFileId, audioFiles, setCurrentFile]);

  useEffect(() => {
    clearCompletionSchedule();
    const frame = requestAnimationFrame(() => {
      setCompletionToastFileId(null);
    });
    hasInteractedRef.current = false;
    completionHandled.current = false;
    onFileChange?.();

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeFileId, clearCompletionSchedule, onFileChange]); // eslint-disable-line react-hooks/exhaustive-deps -- hasInteractedRef is a stable ref

  useEffect(() => {
    return () => {
      clearCompletionSchedule();
    };
  }, [clearCompletionSchedule]);

  useEffect(() => {
    if (!activeFileId) return;
    if (!hasInteractedRef.current) return;
    if (completionHandled.current) return;
    if (pendingCount !== 0 || totalCount <= 0) return;

    completionHandled.current = true;
    clearCompletionSchedule();
    completionRafRef.current = requestAnimationFrame(() => {
      setCompletionToastFileId(activeFileId);
      completionTimerRef.current = setTimeout(() => {
        setCompletionToastFileId((current) => (current === activeFileId ? null : current));
        handleNextFile();
      }, 1500);
    });

    return () => {
      clearCompletionSchedule();
    };
  }, [activeFileId, clearCompletionSchedule, handleNextFile, pendingCount, totalCount]); // eslint-disable-line react-hooks/exhaustive-deps -- hasInteractedRef is a stable ref

  return {
    isLastFile,
    fileCompleteToast,
    handleFileClick,
    handleNextFile,
    handlePrevFile,
  };
}
