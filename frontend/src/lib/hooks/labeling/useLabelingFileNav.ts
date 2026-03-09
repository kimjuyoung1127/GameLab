/** 파일 네비게이션: 클릭/이전/다음 + 완료 감지 자동 이동. */
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
  const [fileCompleteToast, setFileCompleteToast] = useState(false);
  const completionHandled = useRef(false);

  const isLastFile = (() => {
    if (!activeFileId) return true;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    return idx >= audioFiles.length - 1;
  })();

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

  // File completion detection + auto-next
  useEffect(() => {
    if (!hasInteractedRef.current) return;
    if (completionHandled.current) return;
    if (pendingCount === 0 && totalCount > 0 && !fileCompleteToast) {
      completionHandled.current = true;
      setFileCompleteToast(true);
      const timer = setTimeout(() => {
        setFileCompleteToast(false);
        handleNextFile();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingCount, totalCount, fileCompleteToast, handleNextFile]); // eslint-disable-line react-hooks/exhaustive-deps -- hasInteractedRef is a stable ref

  // Reset on file change
  useEffect(() => {
    setFileCompleteToast(false);
    hasInteractedRef.current = false;
    completionHandled.current = false;
    onFileChange?.();
  }, [activeFileId, onFileChange]); // eslint-disable-line react-hooks/exhaustive-deps -- hasInteractedRef is a stable ref

  return {
    isLastFile,
    fileCompleteToast,
    handleFileClick,
    handleNextFile,
    handlePrevFile,
  };
}
