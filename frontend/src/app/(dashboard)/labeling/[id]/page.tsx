/** Labeling workspace route: orchestrates 3-panel layout, state wiring, and interaction handlers. */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useScoreStore } from "@/lib/store/score-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAchievementStore } from "@/lib/store/achievement-store";
import { useUIStore } from "@/lib/store/ui-store";
import { loadSavedProgress, useAutosave } from "@/lib/hooks/use-autosave";
import { useWaveform } from "@/lib/hooks/use-waveform";
import { useSpectrogram } from "@/lib/hooks/use-spectrogram";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useLabelingHotkeys } from "@/lib/hooks/labeling/useLabelingHotkeys";
import ActionHistoryPanel from "./components/ActionHistoryPanel";
import AnalysisPanel from "./components/AnalysisPanel";
import BookmarksPanel from "./components/BookmarksPanel";
import FileListPanel from "./components/FileListPanel";
import LabelingHeader from "./components/LabelingHeader";
import PlayerControls from "./components/PlayerControls";
import SpectrogramPanel from "./components/SpectrogramPanel";
import ToolBar from "./components/ToolBar";
import { useDraftInteractions } from "./hooks/useDraftInteractions";
import { useSuggestionInteractions } from "./hooks/useSuggestionInteractions";
import { endpoints } from "@/lib/api/endpoints";
import { enqueueStatusUpdate } from "@/lib/api/action-queue";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  ActionHistoryItem,
  AudioFile,
  BookmarkType,
  ManualDraft,
  Session,
  Suggestion,
  SuggestionStatus,
} from "@/types";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Spectrogram helpers                                                */
/* ------------------------------------------------------------------ */
const MAX_FREQ = 20_000; // Hz

function parseDurationToSeconds(dur: string): number {
  const parts = dur.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

function formatTimecode(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function normalizeAudioUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) return url;
  try {
    const origin = new URL(apiBase).origin;
    return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  } catch {
    return url;
  }
}

function suggestionBoxStyle(
  s: Suggestion | ManualDraft,
  totalDuration: number,
  fMin = 0,
  fMax = MAX_FREQ,
) {
  const leftPct = (s.startTime / totalDuration) * 100;
  const widthPct = ((s.endTime - s.startTime) / totalDuration) * 100;
  const range = fMax - fMin || 1;
  const topPct = Math.max(0, ((fMax - s.freqHigh) / range) * 100);
  const heightPct = Math.min(100 - topPct, ((s.freqHigh - s.freqLow) / range) * 100);
  return { left: `${leftPct}%`, width: `${widthPct}%`, top: `${topPct}%`, height: `${heightPct}%` };
}

const statusColors: Record<SuggestionStatus, { border: string; bg: string; tagBg: string; label: string; dashed: boolean }> = {
  pending:   { border: "border-orange-400", bg: "bg-orange-400", tagBg: "bg-orange-400/90", label: "text-orange-400", dashed: true },
  confirmed: { border: "border-accent",     bg: "bg-accent",     tagBg: "bg-accent/90",     label: "text-accent",     dashed: false },
  rejected:  { border: "border-danger",     bg: "bg-danger",     tagBg: "bg-danger/90",     label: "text-danger",     dashed: true },
  corrected: { border: "border-cyan-400",   bg: "bg-cyan-400",   tagBg: "bg-cyan-400/90",   label: "text-cyan-400",   dashed: false },
};

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                                */
/* ================================================================== */
export default function LabelingWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  /* ----- Stores --------------------------------------------------- */
  const {
    mode,
    tool,
    setTool,
    snapEnabled,
    toggleSnap,
    suggestions,
    manualDrafts,
    selectedDraftId,
    loopState,
    setLoopState,
    bookmarks,
    history,
    selectedSuggestionId,
    confirmSuggestion,
    rejectSuggestion,
    applyFix,
    undo,
    redo,
    addBookmark,
    updateBookmark,
    removeBookmark,
    pushHistory,
    clearHistory,
    selectDraft,
    startDraft,
    updateDraft,
    removeDraft,
    saveDraftsSuccess,
    loadSuggestions,
    restoreSuggestions,
    selectSuggestion,
    updateSuggestion,
    deleteSuggestion,
  } = useAnnotationStore();

  const { score, streak, addScore, addConfirm, addFix, incrementStreak, incrementDailyProgress, dailyGoal, dailyProgress, fetchFromServer } =
    useScoreStore();

  const t = useTranslations("labeling");

  const {
    files,
    currentFileId,
    setCurrentFile,
    setCurrentSessionById,
    setSessions,
    setFiles,
  } = useSessionStore();

  const { checkAndUnlock, recentUnlock, clearRecent, load: loadAchievements } = useAchievementStore();
  const { showToast } = useUIStore();

  /* ----- Local UI state ------------------------------------------- */
  const [fileFilter, setFileFilter] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "done">("all");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [fileProgressMap, setFileProgressMap] = useState<Record<string, { total: number; reviewed: number }>>({});
  const [fileCompleteToast, setFileCompleteToast] = useState(false);
  const [audioRetryKey, setAudioRetryKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fitToSuggestion, setFitToSuggestion] = useState(true);
  const [showFitToast, setShowFitToast] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [loopHudWarning, setLoopHudWarning] = useState(false);
  const [highlightedBookmarkId, setHighlightedBookmarkId] = useState<string | null>(null);
  const [freqMin, setFreqMin] = useState(0);
  const [freqMax, setFreqMax] = useState(MAX_FREQ);
  const hasInteracted = useRef(false);
  const completionHandled = useRef(false);
  const spectrogramRef = useRef<HTMLDivElement>(null);

  /* ----- Derived -------------------------------------------------- */
  const audioFiles: AudioFile[] = files;
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const activeFileId = currentFileId ?? audioFiles[0]?.id ?? null;
  const activeFile = audioFiles.find((f) => f.id === activeFileId) ?? audioFiles[0];
  const parsedDuration = activeFile ? Math.max(parseDurationToSeconds(activeFile.duration), 1) : 600;

  /* ----- Audio player + Waveform hooks ----------------------------- */
  const audioUrl: string | null = normalizeAudioUrl(activeFile?.audioUrl);
  const player = useAudioPlayer(audioUrl, parsedDuration, audioRetryKey);
  const { data: waveformData, error: waveformError } = useWaveform(audioUrl, audioRetryKey);
  const { data: spectrogramData, loading: spectrogramLoading } = useSpectrogram(waveformData, freqMin, freqMax);
  const audioLoadError = player.error ?? waveformError;

  // Dynamic max frequency from spectrogram (Nyquist), fallback to 20kHz
  const effectiveMaxFreqRef = useRef(MAX_FREQ);
  useEffect(() => {
    effectiveMaxFreqRef.current = spectrogramData?.maxFrequency ?? MAX_FREQ;
  }, [spectrogramData]);
  const effectiveMaxFreq = spectrogramData?.maxFrequency ?? MAX_FREQ;

  const totalDuration = player.duration || parsedDuration;
  const playbackPct = totalDuration > 0 ? (player.currentTime / totalDuration) * 100 : 0;

  /* ----- Autosave ------------------------------------------------- */
  useAutosave(activeFileId);

  const filteredFiles = audioFiles.filter((f) => {
    const matchesSearch = f.filename.toLowerCase().includes(fileFilter.toLowerCase());
    const matchesTab =
      filterTab === "all" ||
      (filterTab === "pending" && f.status === "pending") ||
      (filterTab === "done" && f.status === "done");
    return matchesSearch && matchesTab;
  });

  const activeSuggestion =
    suggestions.find((s) => s.id === selectedSuggestionId && s.status === "pending" && s.source !== "user") ??
    suggestions.find((s) => s.status === "pending" && s.source !== "user");

  const rejectedSuggestion =
    mode === "edit"
      ? suggestions.find((s) => s.id === selectedSuggestionId && s.status === "rejected")
      : null;

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const confirmedCount = suggestions.filter((s) => s.status === "confirmed").length;
  const totalCount = suggestions.length;
  const loopRangeLabel =
    loopState.start !== null && loopState.end !== null && loopState.end > loopState.start
      ? `${formatTimecode(loopState.start)} ~ ${formatTimecode(loopState.end)}`
      : t("stateHudOff");
  const bookmarkPresets: { type: BookmarkType; label: string; note: string }[] = [
    { type: "recheck", label: t("bookmarkRecheck"), note: t("bookmarkRecheckNote") },
    { type: "noise_suspect", label: t("bookmarkNoise"), note: t("bookmarkNoiseNote") },
    { type: "edge_case", label: t("bookmarkEdge"), note: t("bookmarkEdgeNote") },
    { type: "needs_analysis", label: t("bookmarkNeedsAnalysis"), note: t("bookmarkNeedsAnalysisNote") },
  ];

  /* ----- Score sync + achievement load ------------------------------ */
  useEffect(() => {
    void fetchFromServer();
    void loadAchievements();
  }, [fetchFromServer, loadAchievements]);

  /* ----- Achievement unlock toast --------------------------------- */
  useEffect(() => {
    if (recentUnlock) {
      showToast(recentUnlock.name);
      clearRecent();
    }
  }, [recentUnlock, clearRecent, showToast]);

  /* ----- Session init --------------------------------------------- */
  useEffect(() => {
    if (!sessionId) return;
    setSessionError(null);
    const loadSessionData = async () => {
      try {
        const [sessionsRes, filesRes] = await Promise.all([
          authFetch(endpoints.sessions.list),
          authFetch(endpoints.sessions.files(sessionId)),
        ]);

        if (!sessionsRes.ok) {
          throw new Error("Failed to load sessions");
        }
        if (!filesRes.ok) {
          throw new Error("Failed to load session files");
        }

        const sessionsData = (await sessionsRes.json()) as Session[];
        const filesData = (await filesRes.json()) as AudioFile[];

        setSessions(sessionsData);
        const targetSession = setCurrentSessionById(sessionId);
        setFiles(filesData);

        if (!targetSession && filesData.length === 0) {
          router.replace("/sessions");
        }
      } catch (err) {
        setSessionError((err as Error).message || "Failed to load labeling data");
      }
    };

    void loadSessionData();
  }, [router, sessionId, setCurrentSessionById, setFiles, setSessions]);

  useEffect(() => {
    if (!sessionId || !activeFileId) return;
    setSuggestionError(null);
    let cancelled = false;

    const loadSuggestionData = async (retryCount = 0) => {
      try {
        const res = await authFetch(endpoints.labeling.suggestions(sessionId));
        if (!res.ok) {
          throw new Error("Failed to load suggestions");
        }
        const allRaw = (await res.json()) as Suggestion[];
        const all = allRaw.map((s) => ({ ...s, source: s.source ?? "ai", createdBy: s.createdBy ?? null }));
        const filtered = all.filter((s) => s.audioId === activeFileId);

        if (filtered.length === 0 && retryCount < 5 && !cancelled) {
          await new Promise((r) => setTimeout(r, 3000));
          if (!cancelled) return loadSuggestionData(retryCount + 1);
          return;
        }

        if (cancelled) return;

        // Compute per-file progress map from all session suggestions
        const progressMap: Record<string, { total: number; reviewed: number }> = {};
        for (const s of all) {
          if (!progressMap[s.audioId]) progressMap[s.audioId] = { total: 0, reviewed: 0 };
          progressMap[s.audioId].total++;
          if (s.status !== "pending") progressMap[s.audioId].reviewed++;
        }
        setFileProgressMap(progressMap);

        loadSuggestions(filtered);

        const saved = loadSavedProgress(activeFileId);
        if (saved?.suggestions?.length) {
          restoreSuggestions(saved.suggestions);
        }
      } catch (err) {
        if (cancelled) return;
        loadSuggestions([]);
        setSuggestionError((err as Error).message || "Failed to load suggestions");
      }
    };

    void loadSuggestionData();
    return () => { cancelled = true; };
  }, [activeFileId, loadSuggestions, restoreSuggestions, sessionId]);

  /* ----- Handlers ------------------------------------------------- */
  const handleConfirm = useCallback(() => {
    hasInteracted.current = true;
    const currentId = selectedSuggestionId;
    const selected = suggestions.find((s) => s.id === currentId);
    if (!selected || selected.source === "user") {
      showToast(t("manualConfirmBlocked"));
      return;
    }
    const result = confirmSuggestion();
    if (result) {
      addScore(result.points);
      addConfirm();
      incrementStreak();
      incrementDailyProgress();
      if (currentId) enqueueStatusUpdate(currentId, "confirmed");
      void checkAndUnlock();
    }
  }, [suggestions, selectedSuggestionId, showToast, t, confirmSuggestion, addScore, addConfirm, incrementStreak, incrementDailyProgress, checkAndUnlock]);

  const handleReject = useCallback(() => {
    hasInteracted.current = true;
    const currentId = selectedSuggestionId;
    rejectSuggestion();
    if (currentId) enqueueStatusUpdate(currentId, "rejected");
  }, [rejectSuggestion, selectedSuggestionId]);

  const handleApplyFix = useCallback(() => {
    hasInteracted.current = true;
    const currentId = selectedSuggestionId;
    const result = applyFix();
    if (result) {
      addScore(result.points);
      addFix();
      incrementStreak();
      incrementDailyProgress();
      if (currentId) enqueueStatusUpdate(currentId, "corrected");
      void checkAndUnlock();
    }
  }, [applyFix, addScore, addFix, incrementStreak, incrementDailyProgress, selectedSuggestionId, checkAndUnlock]);

  const seekTo = useCallback((time: number, trackHistory = false) => {
    player.seek(time);
    if (trackHistory) {
      pushHistory("seek", `Seek to ${time.toFixed(2)}s`, { time });
    }
  }, [player, pushHistory]);

  const handleSelectSuggestion = useCallback((id: string | null) => {
    selectSuggestion(id);
    if (!id) return;
    const selected = suggestions.find((item) => item.id === id);
    if (!selected) return;
    if (fitToSuggestion) {
      const segment = Math.max(selected.endTime - selected.startTime, 0.25);
      const desiredZoom = Math.min(3, Math.max(1, totalDuration / (segment * 4)));
      setZoomLevel(desiredZoom);
      setShowFitToast(true);
    }
    seekTo((selected.startTime + selected.endTime) / 2, true);
  }, [fitToSuggestion, seekTo, selectSuggestion, suggestions, totalDuration]);

  const handleFileClick = useCallback((file: AudioFile) => {
    setCurrentFile(file.id);
  }, [setCurrentFile]);

  const isLastFile = (() => {
    if (!activeFileId) return true;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    return idx >= audioFiles.length - 1;
  })();

  const handleNextFile = useCallback(() => {
    if (!activeFileId) return;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    const nextFile = audioFiles[idx + 1];
    if (nextFile) {
      setCurrentFile(nextFile.id);
    } else {
      router.push("/sessions");
    }
  }, [activeFileId, audioFiles, router, setCurrentFile]);

  const handlePrevFile = useCallback(() => {
    if (!activeFileId) return;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    const prevFile = audioFiles[idx - 1];
    if (prevFile) {
      setCurrentFile(prevFile.id);
    }
  }, [activeFileId, audioFiles, setCurrentFile]);

  const {
    isDraggingSuggestion,
    isResizingSuggestion,
    handleSugDragPointerDown,
    handleSugDragPointerMove,
    handleSugDragPointerUp,
    handleSugResizePointerDown,
    handleSugResizePointerMove,
    handleSugResizePointerUp,
    handleDeleteSelectedSuggestion,
  } = useSuggestionInteractions({
    tool,
    totalDuration,
    snapEnabled,
    effectiveMaxFreqRef,
    spectrogramRef,
    updateSuggestion,
    selectSuggestion,
    deleteSuggestion,
    pushHistory,
    suggestions,
    selectedSuggestionId,
    showToast,
    t: (key) => t(key),
    undo,
  });

  const {
    draftPreview,
    handleDraftPointerDown,
    handleDraftPointerMove,
    handleDraftPointerUp,
    handleDraftDragPointerDown,
    handleDraftDragPointerMove,
    handleDraftDragPointerUp,
    handleDraftResizePointerDown,
    handleDraftResizePointerMove,
    handleDraftResizePointerUp,
  } = useDraftInteractions({
    activeFileId,
    tool,
    totalDuration,
    snapEnabled,
    effectiveMaxFreqRef,
    spectrogramRef,
    isDraggingSuggestion,
    isResizingSuggestion,
    seekTo,
    t: (key) => t(key),
    startDraft,
    updateDraft,
    selectDraft,
    pushHistory,
  });

  const handleDeleteSelectedDraft = useCallback(() => {
    if (!selectedDraftId) return;
    removeDraft(selectedDraftId);
  }, [removeDraft, selectedDraftId]);

  const handleSaveManualDrafts = useCallback(async () => {
    if (!sessionId || manualDrafts.length === 0) {
      showToast(t("manualNoDraftToSave"));
      return;
    }
    const targetDrafts = selectedDraftId
      ? manualDrafts.filter((d) => d.id === selectedDraftId)
      : manualDrafts;
    if (targetDrafts.length === 0) {
      showToast(t("manualNoDraftToSave"));
      return;
    }

    const payload = {
      suggestions: targetDrafts.map((d) => ({
        audioId: d.audioId,
        label: d.label,
        startTime: d.startTime,
        endTime: d.endTime,
        freqLow: d.freqLow,
        freqHigh: d.freqHigh,
        description: d.description,
        confidence: 100,
      })),
    };

    try {
      const res = await authFetch(endpoints.labeling.createSuggestions(sessionId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save manual suggestions");
      const created = (await res.json()) as Suggestion[];
      saveDraftsSuccess(
        created.map((s) => ({ ...s, source: s.source ?? "user", createdBy: s.createdBy ?? null })),
        targetDrafts.map((d) => d.id),
      );
      showToast(t("manualSaved", { count: created.length }));
    } catch (err) {
      showToast((err as Error).message ?? t("manualSaveFailed"));
    }
  }, [manualDrafts, saveDraftsSuccess, selectedDraftId, sessionId, showToast, t]);

  const handleSetLoopStart = useCallback(() => {
    setLoopState({ start: player.currentTime });
    pushHistory("loop_set", `Loop start ${player.currentTime.toFixed(2)}s`, {
      loopStart: player.currentTime,
      loopEnd: loopState.end,
    });
  }, [player.currentTime, pushHistory, setLoopState, loopState.end]);

  const handleSetLoopEnd = useCallback(() => {
    setLoopState({ end: player.currentTime });
    pushHistory("loop_set", `Loop end ${player.currentTime.toFixed(2)}s`, {
      loopStart: loopState.start,
      loopEnd: player.currentTime,
    });
  }, [player.currentTime, pushHistory, setLoopState, loopState.start]);

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

  const handleAddBookmark = useCallback((preset: { type: BookmarkType; label: string; note: string }) => {
    addBookmark({
      time: player.currentTime,
      type: preset.type,
      note: preset.note,
      suggestionId: selectedSuggestionId ?? undefined,
    });
    showToast(t("bookmarkAdded", { label: preset.label }));
  }, [addBookmark, player.currentTime, selectedSuggestionId, showToast, t]);

  const handleMarkNeedsAnalysis = useCallback(() => {
    addBookmark({
      time: player.currentTime,
      type: "needs_analysis",
      note: t("bookmarkNeedsAnalysisNote"),
      suggestionId: selectedSuggestionId ?? undefined,
    });
    showToast(t("bookmarkNeedsAnalysisAdded"));
  }, [addBookmark, player.currentTime, selectedSuggestionId, showToast, t]);

  const handleBookmarkSeek = useCallback((time: number, bookmarkId: string) => {
    seekTo(time, true);
    setHighlightedBookmarkId(bookmarkId);
    setTimeout(() => setHighlightedBookmarkId(null), 800);
  }, [seekTo]);

  const handleJumpToNextBookmark = useCallback(() => {
    const sorted = [...bookmarks].sort((a, b) => a.time - b.time);
    const next = sorted.find((b) => b.time > player.currentTime + 0.01);
    if (next) {
      seekTo(next.time, true);
      setHighlightedBookmarkId(next.id);
      setTimeout(() => setHighlightedBookmarkId(null), 800);
    }
  }, [bookmarks, player.currentTime, seekTo]);

  const handleJumpToPrevBookmark = useCallback(() => {
    const sorted = [...bookmarks].sort((a, b) => b.time - a.time);
    const prev = sorted.find((b) => b.time < player.currentTime - 0.01);
    if (prev) {
      seekTo(prev.time, true);
      setHighlightedBookmarkId(prev.id);
      setTimeout(() => setHighlightedBookmarkId(null), 800);
    }
  }, [bookmarks, player.currentTime, seekTo]);

  const handleReplayHistory = useCallback((item: ActionHistoryItem) => {
    if (typeof item.payload?.time === "number") {
      seekTo(item.payload.time, false);
      return;
    }
    if (typeof item.payload?.loopStart === "number") {
      setLoopState({ start: item.payload.loopStart });
    }
    if (typeof item.payload?.loopEnd === "number") {
      setLoopState({ end: item.payload.loopEnd });
    }
  }, [setLoopState, seekTo]);

  /* ----- File completion detection + auto-next -------------------- */
  useEffect(() => {
    if (!hasInteracted.current) return;
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
  }, [pendingCount, totalCount, fileCompleteToast, handleNextFile]);

  // Reset toast when file changes
  useEffect(() => {
    setFileCompleteToast(false);
    hasInteracted.current = false;
    completionHandled.current = false;
  }, [activeFileId]);

  useEffect(() => {
    if (!showFitToast) return;
    const timer = setTimeout(() => setShowFitToast(false), 1200);
    return () => clearTimeout(timer);
  }, [showFitToast]);

  useEffect(() => {
    if (!loopHudWarning) return;
    const timer = setTimeout(() => setLoopHudWarning(false), 1600);
    return () => clearTimeout(timer);
  }, [loopHudWarning]);

  useEffect(() => {
    player.setLoopStart(loopState.start);
    player.setLoopEnd(loopState.end);
    player.setLoopEnabled(loopState.enabled);
  }, [loopState, player]);

  useLabelingHotkeys({
    mode,
    setTool,
    toggleSnap,
    handleConfirm,
    handleReject,
    handleApplyFix,
    handleNextFile,
    handlePrevFile,
    handleSaveManualDrafts,
    handleDeleteSelectedDraft,
    undo,
    redo,
    onSetLoopStart: handleSetLoopStart,
    onSetLoopEnd: handleSetLoopEnd,
    onToggleLoop: handleToggleLoop,
    onMarkNeedsAnalysis: handleMarkNeedsAnalysis,
    onJumpToNextBookmark: handleJumpToNextBookmark,
    onJumpToPrevBookmark: handleJumpToPrevBookmark,
    handleDeleteSelectedSuggestion,
    player,
    suggestions,
    manualDrafts,
    selectedDraftId,
    selectedSuggestionId,
    selectSuggestion: handleSelectSuggestion,
    setZoomLevel,
  });

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas text-text">
      <LabelingHeader
        mode={mode}
        score={score}
        streak={streak}
        sessionError={sessionError}
        suggestionError={suggestionError}
      />

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <FileListPanel
          fileFilter={fileFilter}
          onFileFilterChange={setFileFilter}
          filterTab={filterTab}
          onFilterTabChange={setFilterTab}
          filteredFiles={filteredFiles}
          activeFileId={activeFileId}
          onFileClick={handleFileClick}
          fileProgressMap={fileProgressMap}
          dailyGoal={dailyGoal}
          dailyProgress={dailyProgress}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-canvas">
          <ToolBar
            tool={tool}
            snapEnabled={snapEnabled}
            fitToSuggestion={fitToSuggestion}
            onToolChange={setTool}
            onToggleSnap={toggleSnap}
            onToggleFit={() => setFitToSuggestion((prev) => !prev)}
            onUndo={undo}
            onRedo={redo}
            onZoomLevelChange={setZoomLevel}
            confirmedCount={confirmedCount}
            totalCount={totalCount}
            sessionId={sessionId}
            activeFileName={activeFile?.filename}
            onSaveManualDrafts={handleSaveManualDrafts}
            pendingDraftCount={manualDrafts.length}
            bookmarkCount={bookmarks.length}
          />

          <SpectrogramPanel
            waveformData={waveformData}
            spectrogramData={spectrogramData}
            spectrogramLoading={spectrogramLoading}
            player={player}
            totalDuration={totalDuration}
            zoomLevel={zoomLevel}
            fileCompleteToast={fileCompleteToast}
            isLastFile={isLastFile}
            onDismissCompleteToast={() => setFileCompleteToast(false)}
            effectiveMaxFreq={effectiveMaxFreq}
            spectrogramRef={spectrogramRef}
            tool={tool}
            suggestions={suggestions}
            manualDrafts={manualDrafts}
            selectedSuggestionId={selectedSuggestionId}
            selectedDraftId={selectedDraftId}
            onSelectSuggestion={handleSelectSuggestion}
            onSelectDraft={selectDraft}
            onDraftPointerDown={handleDraftPointerDown}
            onDraftPointerMove={handleDraftPointerMove}
            onDraftPointerUp={handleDraftPointerUp}
            onSuggestionDragPointerDown={handleSugDragPointerDown}
            onSuggestionDragPointerMove={handleSugDragPointerMove}
            onSuggestionDragPointerUp={(e) => {
              void handleSugDragPointerUp(e);
            }}
            onSuggestionResizePointerDown={handleSugResizePointerDown}
            onSuggestionResizePointerMove={handleSugResizePointerMove}
            onSuggestionResizePointerUp={(e) => {
              void handleSugResizePointerUp(e);
            }}
            onDraftDragPointerDown={handleDraftDragPointerDown}
            onDraftDragPointerMove={handleDraftDragPointerMove}
            onDraftDragPointerUp={handleDraftDragPointerUp}
            onDraftResizePointerDown={handleDraftResizePointerDown}
            onDraftResizePointerMove={handleDraftResizePointerMove}
            onDraftResizePointerUp={handleDraftResizePointerUp}
            suggestionBoxStyle={suggestionBoxStyle}
            freqMin={freqMin}
            freqMax={freqMax}
            onFreqRangeChange={(min, max) => { setFreqMin(min); setFreqMax(max); }}
            statusColors={statusColors}
            draftPreview={draftPreview}
            playbackPct={playbackPct}
            formatTimecode={formatTimecode}
            loopState={loopState}
            bookmarks={bookmarks}
            loopRangeLabel={loopRangeLabel}
            fitToSuggestion={fitToSuggestion}
            showFitToast={showFitToast}
            loopHudWarning={loopHudWarning}
            activeSuggestion={activeSuggestion ?? null}
            onConfirm={handleConfirm}
            onReject={handleReject}
            audioLoadError={audioLoadError}
            onRetryAudio={() => setAudioRetryKey((k) => k + 1)}
            onSeek={seekTo}
            highlightedBookmarkId={highlightedBookmarkId}
          />

          <PlayerControls
            player={player}
            activeFileDuration={activeFile?.duration}
            loopEnabled={loopState.enabled}
            onSetLoopStart={handleSetLoopStart}
            onSetLoopEnd={handleSetLoopEnd}
            onToggleLoop={handleToggleLoop}
            onAddBookmark={handleAddBookmark}
            bookmarkPreset={bookmarkPresets[0]}
          />
        </main>

        <AnalysisPanel
          mode={mode}
          activeSuggestion={activeSuggestion ?? null}
          rejectedSuggestion={rejectedSuggestion ?? null}
          pendingCount={pendingCount}
          confirmedCount={confirmedCount}
          totalCount={totalCount}
          activeFile={activeFile}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onApplyFix={handleApplyFix}
          onNextFile={handleNextFile}
        >
          <BookmarksPanel
            bookmarks={bookmarks}
            presets={bookmarkPresets}
            onAdd={handleAddBookmark}
            onSeek={handleBookmarkSeek}
            onRemove={removeBookmark}
            onUpdate={updateBookmark}
            highlightedId={highlightedBookmarkId}
          />

          <ActionHistoryPanel
            items={history}
            onClear={clearHistory}
            onReplay={handleReplayHistory}
            collapsed={historyCollapsed}
            onToggleCollapsed={() => setHistoryCollapsed((prev) => !prev)}
            undoHint={t("historyUndoHint")}
          />
        </AnalysisPanel>
      </div>
    </div>
  );
}
