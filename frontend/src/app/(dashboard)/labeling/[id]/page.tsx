/** Labeling workspace route: orchestrates 3-panel layout, state wiring, and interaction handlers. */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useScoreStore } from "@/lib/store/score-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAchievementStore } from "@/lib/store/achievement-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { useWaveform } from "@/lib/hooks/use-waveform";
import { useSpectrogram, type SpectrogramFftOptions } from "@/lib/hooks/use-spectrogram";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useSegmentPlayback } from "@/lib/hooks/use-segment-playback";
import { useLabelingActions } from "@/lib/hooks/labeling/useLabelingActions";
import { useLabelingHotkeys } from "@/lib/hooks/labeling/useLabelingHotkeys";
import { useLabelingSessionData } from "@/lib/hooks/labeling/useLabelingSessionData";
import { useLabelingSuggestions } from "@/lib/hooks/labeling/useLabelingSuggestions";
import { useListeningSelection } from "@/lib/hooks/labeling/useListeningSelection";
import { useLabelingViewport } from "@/lib/hooks/labeling/useLabelingViewport";
import { useLabelingFileNav } from "@/lib/hooks/labeling/useLabelingFileNav";
import { useLabelingLoop } from "@/lib/hooks/labeling/useLabelingLoop";
import { useLabelingBookmarks } from "@/lib/hooks/labeling/useLabelingBookmarks";
import { useLabelingSegmentPlayback } from "@/lib/hooks/labeling/useLabelingSegmentPlayback";
import { useLlmPrefetch } from "@/lib/hooks/labeling/useLlmPrefetch";
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
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  ActionHistoryItem,
  AudioFile,
  BookmarkType,
  ManualDraft,
  Suggestion,
  SuggestionStatus,
} from "@/types";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Spectrogram helpers                                                */
/* ------------------------------------------------------------------ */
const MAX_FREQ = 20_000; // Hz
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 10.0;
const ENABLE_SPECTRO_LISTENING_V1 = process.env.NEXT_PUBLIC_ENABLE_SPECTRO_LISTENING_V1 === "true";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || null;

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

function parseSampleRateHz(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "unknown") return undefined;

  const khzMatch = normalized.match(/(\d+(?:\.\d+)?)\s*khz/);
  if (khzMatch) {
    const parsed = Number.parseFloat(khzMatch[1]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 1000) : undefined;
  }

  const hzMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!hzMatch) return undefined;
  const parsed = Number.parseFloat(hzMatch[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
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
    statusFilter,
    setStatusFilter,
    assistMap,
  } = useAnnotationStore();

  const {
    score,
    streak,
    addScore,
    addConfirm,
    addFix,
    incrementStreak,
    incrementDailyProgress,
    dailyGoal,
    dailyProgress,
    fetchFromServer,
    refreshGamificationSnapshot,
  } =
    useScoreStore();

  const t = useTranslations("labeling");

  const {
    currentSession,
    files,
    currentFileId,
    setCurrentFile,
  } = useSessionStore();

  const { checkAndUnlock, recentUnlock, clearRecent, load: loadAchievements } = useAchievementStore();
  const { showToast, autoAdvance, toggleAutoAdvance } = useUIStore();
  const spectroListeningEnabled = ENABLE_SPECTRO_LISTENING_V1;

  /* ----- Local UI state ------------------------------------------- */
  const [fileFilter, setFileFilter] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "done">("all");
  // sessionError + suggestionError + fileProgressMap are managed by hooks below
  const [audioRetryKey, setAudioRetryKey] = useState(0);
  const [fitToSuggestion, setFitToSuggestion] = useState(false);
  const [showFitToast, setShowFitToast] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [freqAxisScale, setFreqAxisScale] = useState<"linear" | "log">("linear");
  const [fftOptions, setFftOptions] = useState<SpectrogramFftOptions>({});
  const spectrogramRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* ----- Derived -------------------------------------------------- */
  const audioFiles: AudioFile[] = files;
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const activeFileId = currentFileId ?? audioFiles[0]?.id ?? null;
  const activeFile = audioFiles.find((f) => f.id === activeFileId) ?? audioFiles[0];
  const headerProjectName = currentSession?.name || activeFile?.filename || "Unnamed Session";
  const parsedDuration = activeFile ? Math.max(parseDurationToSeconds(activeFile.duration), 1) : 600;
  const targetSampleRate = parseSampleRateHz(activeFile?.sampleRate);

  /* ----- Audio player + Waveform hooks ----------------------------- */
  const audioUrl: string | null = normalizeAudioUrl(activeFile?.audioUrl);
  const player = useAudioPlayer(audioUrl, parsedDuration, audioRetryKey);
  const { data: waveformData, error: waveformError } = useWaveform(audioUrl, audioRetryKey, targetSampleRate);
  const audioLoadError = player.error ?? waveformError;
  const segmentPlayback = useSegmentPlayback({
    channelData: waveformData?.channelData,
    sampleRate: waveformData?.sampleRate,
  });

  const totalDuration = player.duration || parsedDuration;

  /* ----- Viewport (zoom/pan/undo) ---------------------------------- */
  const {
    zoomLevel, setZoomLevel, freqMin, setFreqMin, freqMax, setFreqMax,
    zoomBoxMode, setZoomBoxMode,
    handleZoomLevelChange, handleZoomToBox, handleUndoAllEdits, handleResetView, clearViewportUndo,
  } = useLabelingViewport({
    effectiveMaxFreq: waveformData?.sampleRate ? Math.floor(waveformData.sampleRate / 2) : MAX_FREQ,
    totalDuration,
    scrollContainerRef,
    showToast,
    t,
  });

  /* ----- Spectrogram (needs freqMin/freqMax from viewport) --------- */
  const { data: spectrogramData, loading: spectrogramLoading } = useSpectrogram(waveformData, freqMin, freqMax, fftOptions);
  const effectiveMaxFreq = spectrogramData?.maxFrequency ?? MAX_FREQ;

  const playbackPct = totalDuration > 0 ? (player.currentTime / totalDuration) * 100 : 0;
  const {
    selection: listeningSelection,
    setCustomSelection: setListeningSelection,
    clearCustomSelection,
  } = useListeningSelection({
    enabled: spectroListeningEnabled,
    selectedSuggestionId,
    selectedDraftId,
    suggestions,
    manualDrafts,
    maxFrequency: effectiveMaxFreq,
  });

  /* ----- Autosave ------------------------------------------------- */
  useAutosave(activeFileId);

  /* ----- LLM Assist prefetch --------------------------------------- */
  useLlmPrefetch(sessionId);

  /* ----- Session + Suggestion data hooks ----------------------------- */
  const { sessionError } = useLabelingSessionData({
    sessionId,
    onSessionMissing: useCallback(() => router.replace("/sessions"), [router]),
  });
  const { suggestionError, fileProgressMap } = useLabelingSuggestions({
    sessionId,
    activeFileId,
    loadSuggestions,
    restoreSuggestions,
  });

  /* ----- Actions (confirm/reject/fix) ------------------------------ */
  const { hasInteractedRef: hasInteracted, handleConfirm, handleReject, handleApplyFix } = useLabelingActions({
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
    manualConfirmBlockedMsg: t("manualConfirmBlocked"),
    assistMap,
    aiToastConfirmAgree: ({ confidence }: { confidence: number }) => t("aiToastConfirmAgree", { confidence: String(confidence) }),
    aiToastConfirmDisagree: ({ aiAction }: { aiAction: string }) => t("aiToastConfirmDisagree", { aiAction }),
    aiToastRejectAgree: ({ confidence }: { confidence: number }) => t("aiToastRejectAgree", { confidence: String(confidence) }),
    aiToastRejectDisagree: ({ aiAction }: { aiAction: string }) => t("aiToastRejectDisagree", { aiAction }),
    getActionLabel: (action: string) => t(`llmAction_${action}` as Parameters<typeof t>[0]),
  });

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
  const displaySuggestions = statusFilter === "all" ? suggestions : suggestions.filter((s) => s.status === statusFilter);
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

  /* ----- Handlers ------------------------------------------------- */
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
      const desiredZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, totalDuration / (segment * 4)));
      handleZoomLevelChange(() => desiredZoom);
      setShowFitToast(true);
    }
    seekTo((selected.startTime + selected.endTime) / 2, true);
  }, [fitToSuggestion, handleZoomLevelChange, seekTo, selectSuggestion, suggestions, totalDuration]);

  /* ----- File navigation ------------------------------------------ */
  const { isLastFile, fileCompleteToast, handleFileClick, handleNextFile, handlePrevFile } = useLabelingFileNav({
    activeFileId,
    audioFiles,
    setCurrentFile,
    navigateToSessions: useCallback(() => router.push("/sessions"), [router]),
    hasInteractedRef: hasInteracted,
    pendingCount,
    totalCount,
    onFileChange: useCallback(() => {
      setZoomBoxMode(false);
      clearViewportUndo();
    }, [setZoomBoxMode, clearViewportUndo]),
  });

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
    freqMin,
    freqMax,
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
    zoomBoxMode,
    totalDuration,
    snapEnabled,
    freqMin,
    freqMax,
    spectrogramRef,
    isDraggingSuggestion,
    isResizingSuggestion,
    seekTo,
    t: (key) => t(key),
    startDraft,
    onZoomToBox: handleZoomToBox,
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

  /* ----- Loop controls -------------------------------------------- */
  const { loopHudWarning, handleSetLoopStart, handleSetLoopEnd, handleToggleLoop } = useLabelingLoop({
    loopState,
    setLoopState,
    currentTime: player.currentTime,
    setLoopStart: player.setLoopStart,
    setLoopEnd: player.setLoopEnd,
    setLoopEnabled: player.setLoopEnabled,
    pushHistory,
    showToast,
    t,
  });

  const { segmentCurrentTime, isPlaying: segmentIsPlaying, mode: segmentMode, stop: segmentStop } = segmentPlayback;

  /* ----- Segment playback handlers -------------------------------- */
  const { segmentExportError, handlePlayOriginalSelection, handlePlayFilteredSelection, handleDownloadFilteredSelection } = useLabelingSegmentPlayback({
    spectroListeningEnabled,
    listeningSelection,
    segmentIsPlaying,
    segmentMode,
    segmentStop,
    playOriginalSegment: segmentPlayback.playOriginalSegment,
    playFilteredSegment: segmentPlayback.playFilteredSegment,
    playbackRate: player.playbackRate,
    channelData: waveformData?.channelData,
    sampleRate: waveformData?.sampleRate,
    activeFilename: activeFile?.filename ?? "audio",
    showToast,
    t,
  });


  /* ----- Bookmarks ------------------------------------------------ */
  const { highlightedBookmarkId, handleAddBookmark, handleMarkNeedsAnalysis, handleBookmarkSeek, handleJumpToNextBookmark, handleJumpToPrevBookmark } = useLabelingBookmarks({
    currentTime: player.currentTime,
    selectedSuggestionId,
    bookmarks,
    addBookmark,
    seekTo,
    showToast,
    t,
  });

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


  useEffect(() => {
    if (!showFitToast) return;
    const timer = setTimeout(() => setShowFitToast(false), 1200);
    return () => clearTimeout(timer);
  }, [showFitToast]);

  useEffect(() => {
    if (!zoomBoxMode) return;
    showToast(t("zoomBoxModeOn"));
  }, [zoomBoxMode, showToast, t]);

  useEffect(() => {
    clearCustomSelection();
  }, [clearCustomSelection, selectedSuggestionId, selectedDraftId]);

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
    setZoomLevel: handleZoomLevelChange,
    setZoomBoxMode,
    zoomBoxMode,
    onUndoAll: handleUndoAllEdits,
    onResetView: handleResetView,
    spectroListeningEnabled,
    onPlayOriginalSelection: handlePlayOriginalSelection,
    onPlayFilteredSelection: handlePlayFilteredSelection,
  });

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-canvas text-text"
      data-listening-v1={spectroListeningEnabled ? "on" : "off"}
    >
      <LabelingHeader
        mode={mode}
        score={score}
        streak={streak}
        projectName={headerProjectName}
        appVersion={APP_VERSION}
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
            onZoomLevelChange={handleZoomLevelChange}
            confirmedCount={confirmedCount}
            totalCount={totalCount}
            sessionId={sessionId}
            activeFileName={activeFile?.filename}
            autoAdvance={autoAdvance}
            onToggleAutoAdvance={toggleAutoAdvance}
            onSaveManualDrafts={handleSaveManualDrafts}
            pendingDraftCount={manualDrafts.length}
            bookmarkCount={bookmarks.length}
            spectrogramRef={spectrogramRef}
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
            onDismissCompleteToast={() => {}}
            effectiveMaxFreq={effectiveMaxFreq}
            spectrogramRef={spectrogramRef}
            scrollContainerRef={scrollContainerRef}
            tool={tool}
            zoomBoxMode={zoomBoxMode}
            suggestions={displaySuggestions}
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
            onFreqRangeChange={(min, max) => {
              const nextMax = Math.min(Math.max(max, 1), effectiveMaxFreq);
              const nextMin = Math.max(0, Math.min(min, Math.max(nextMax - 1, 0)));
              setFreqMin(nextMin);
              setFreqMax(nextMax);
            }}
            listeningEnabled={spectroListeningEnabled}
            listeningSelection={listeningSelection}
            onListeningSelectionChange={setListeningSelection}
            onPlayOriginalSelection={handlePlayOriginalSelection}
            onPlayFilteredSelection={handlePlayFilteredSelection}
            segmentPlaybackError={segmentPlayback.error?.message ?? null}
            segmentPlaybackActive={segmentIsPlaying}
            segmentPlaybackMode={segmentMode}
            segmentCurrentTime={segmentCurrentTime}
            onStopSegmentPlayback={segmentStop}
            onDownloadFilteredSelection={handleDownloadFilteredSelection}
            segmentExportError={segmentExportError}
            freqAxisScale={freqAxisScale}
            onFreqAxisScaleChange={setFreqAxisScale}
            fftOptions={fftOptions}
            onFftOptionsChange={setFftOptions}
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
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
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
