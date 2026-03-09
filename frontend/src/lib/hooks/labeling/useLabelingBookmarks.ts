/** 북마크: 추가, 분석 필요 마킹, 탐색, 이전/다음 점프. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LabelingBookmark, BookmarkType } from "@/types";

type UseLabelingBookmarksParams = {
  currentTime: number;
  selectedSuggestionId: string | null;
  bookmarks: LabelingBookmark[];
  addBookmark: (b: { time: number; type: BookmarkType; note: string; suggestionId?: string }) => void;
  seekTo: (time: number, trackHistory: boolean) => void;
  showToast: (msg: string) => void;
  t: (key: string, values?: Record<string, string>) => string;
};

export function useLabelingBookmarks({
  currentTime,
  selectedSuggestionId,
  bookmarks,
  addBookmark,
  seekTo,
  showToast,
  t,
}: UseLabelingBookmarksParams) {
  const [highlightedBookmarkId, setHighlightedBookmarkId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup highlight timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const setHighlightWithAutoClear = useCallback((id: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedBookmarkId(id);
    highlightTimerRef.current = setTimeout(() => setHighlightedBookmarkId(null), 800);
  }, []);

  const handleAddBookmark = useCallback((preset: { type: BookmarkType; label: string; note: string }) => {
    addBookmark({
      time: currentTime,
      type: preset.type,
      note: preset.note,
      suggestionId: selectedSuggestionId ?? undefined,
    });
    showToast(t("bookmarkAdded", { label: preset.label }));
  }, [addBookmark, currentTime, selectedSuggestionId, showToast, t]);

  const handleMarkNeedsAnalysis = useCallback(() => {
    addBookmark({
      time: currentTime,
      type: "needs_analysis",
      note: t("bookmarkNeedsAnalysisNote"),
      suggestionId: selectedSuggestionId ?? undefined,
    });
    showToast(t("bookmarkNeedsAnalysisAdded"));
  }, [addBookmark, currentTime, selectedSuggestionId, showToast, t]);

  const handleBookmarkSeek = useCallback((time: number, bookmarkId: string) => {
    seekTo(time, true);
    setHighlightWithAutoClear(bookmarkId);
  }, [seekTo, setHighlightWithAutoClear]);

  const handleJumpToNextBookmark = useCallback(() => {
    const sorted = [...bookmarks].sort((a, b) => a.time - b.time);
    const next = sorted.find((b) => b.time > currentTime + 0.01);
    if (next) {
      seekTo(next.time, true);
      setHighlightWithAutoClear(next.id);
    }
  }, [bookmarks, currentTime, seekTo, setHighlightWithAutoClear]);

  const handleJumpToPrevBookmark = useCallback(() => {
    const sorted = [...bookmarks].sort((a, b) => b.time - a.time);
    const prev = sorted.find((b) => b.time < currentTime - 0.01);
    if (prev) {
      seekTo(prev.time, true);
      setHighlightWithAutoClear(prev.id);
    }
  }, [bookmarks, currentTime, seekTo, setHighlightWithAutoClear]);

  return {
    highlightedBookmarkId,
    handleAddBookmark,
    handleMarkNeedsAnalysis,
    handleBookmarkSeek,
    handleJumpToNextBookmark,
    handleJumpToPrevBookmark,
  };
}
