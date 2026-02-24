/** 라벨링 작업 페이지: 3패널 레이아웃 (파일목록 + 스펙트로그램 + AI제안 패널). 핵심 기능. */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AudioLines,
  Search,
  MousePointer2,
  Anchor,
  Square,
  ZoomIn,
  ZoomOut,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Check,
  Filter,
  FileAudio,
  ChevronRight,
  Undo2,
  Redo2,
  Wrench,
  Repeat,
  Flag,
  BookmarkPlus,
} from "lucide-react";

import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useScoreStore } from "@/lib/store/score-store";
import { useSessionStore } from "@/lib/store/session-store";
import { useAchievementStore } from "@/lib/store/achievement-store";
import { useUIStore } from "@/lib/store/ui-store";
import { loadSavedProgress, useAutosave } from "@/lib/hooks/use-autosave";
import { useWaveform } from "@/lib/hooks/use-waveform";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useLabelingHotkeys } from "@/lib/hooks/labeling/useLabelingHotkeys";
import WaveformCanvas from "@/components/domain/labeling/WaveformCanvas";
import ActionHistoryPanel from "./components/ActionHistoryPanel";
import BookmarksPanel from "./components/BookmarksPanel";
import { endpoints } from "@/lib/api/endpoints";
import { enqueueStatusUpdate } from "@/lib/api/action-queue";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  ActionHistoryItem,
  AudioFile,
  BookmarkType,
  DrawTool,
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
const MIN_DRAFT_DURATION = 0.05; // seconds
const MIN_DRAFT_FREQ_RANGE = 100; // Hz
type ResizeHandle = "nw" | "ne" | "sw" | "se";

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

function suggestionBoxStyle(s: Suggestion | ManualDraft, totalDuration: number) {
  const leftPct = (s.startTime / totalDuration) * 100;
  const widthPct = ((s.endTime - s.startTime) / totalDuration) * 100;
  const topPct = ((MAX_FREQ - s.freqHigh) / MAX_FREQ) * 100;
  const heightPct = ((s.freqHigh - s.freqLow) / MAX_FREQ) * 100;
  return { left: `${leftPct}%`, width: `${widthPct}%`, top: `${topPct}%`, height: `${heightPct}%` };
}

const statusColors: Record<SuggestionStatus, { border: string; bg: string; tagBg: string; label: string; dashed: boolean }> = {
  pending:   { border: "border-orange-400", bg: "bg-orange-400", tagBg: "bg-orange-400/90", label: "text-orange-400", dashed: true },
  confirmed: { border: "border-accent",     bg: "bg-accent",     tagBg: "bg-accent/90",     label: "text-accent",     dashed: false },
  rejected:  { border: "border-danger",     bg: "bg-danger",     tagBg: "bg-danger/90",     label: "text-danger",     dashed: true },
  corrected: { border: "border-cyan-400",   bg: "bg-cyan-400",   tagBg: "bg-cyan-400/90",   label: "text-cyan-400",   dashed: false },
};

/* ------------------------------------------------------------------ */
/*  Tool definitions                                                   */
/* ------------------------------------------------------------------ */
const tools: { id: DrawTool; icon: typeof MousePointer2; labelKey: string; hotkey: string }[] = [
  { id: "select", icon: MousePointer2, labelKey: "toolSelect", hotkey: "A" },
  { id: "anchor", icon: Anchor, labelKey: "toolAnchor", hotkey: "G" },
  { id: "box", icon: Square, labelKey: "toolBox", hotkey: "R" },
];

const zoomTools = [
  { id: "zoom-in" as const, icon: ZoomIn, labelKey: "zoomIn" },
  { id: "zoom-out" as const, icon: ZoomOut, labelKey: "zoomOut" },
];

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("labeling");
  const map: Record<string, { label: string; cls: string }> = {
    wip: { label: t("statusWip"), cls: "bg-warning/20 text-warning" },
    pending: { label: t("statusPending"), cls: "bg-primary/20 text-primary-light" },
    done: { label: t("statusDone"), cls: "bg-accent/20 text-accent" },
  };
  const info = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${info.cls}`}>
      {info.label}
    </span>
  );
}

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
  const [isDrawingDraft, setIsDrawingDraft] = useState(false);
  const [draftPreview, setDraftPreview] = useState<ManualDraft | null>(null);
  const hasInteracted = useRef(false);
  const completionHandled = useRef(false);
  const spectrogramRef = useRef<HTMLDivElement>(null);
  const draftPointerRef = useRef<{ audioId: string; startTime: number; startFreq: number } | null>(null);
  const draftUpdateRafRef = useRef<number | null>(null);
  const pendingPreviewRef = useRef<ManualDraft | null>(null);
  const [isDraggingDraft, setIsDraggingDraft] = useState(false);
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
  const [isResizingDraft, setIsResizingDraft] = useState(false);
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
  const audioLoadError = player.error ?? waveformError;

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

  const handleScrubFromSpectrogram = useCallback((clientX: number) => {
    const area = spectrogramRef.current;
    if (!area || totalDuration <= 0) return;
    const rect = area.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = rect.width > 0 ? x / rect.width : 0;
    seekTo(ratio * totalDuration, false);
  }, [seekTo, totalDuration]);

  const pointerToDomain = useCallback((clientX: number, clientY: number) => {
    const area = spectrogramRef.current;
    if (!area || totalDuration <= 0) return null;
    const rect = area.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const time = (x / Math.max(rect.width, 1)) * totalDuration;
    const freq = MAX_FREQ * (1 - y / Math.max(rect.height, 1));
    return { time, freq };
  }, [totalDuration]);

  const handleDraftPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeFileId) return;
    if (isDraggingDraft || isResizingDraft) return;
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
      freqHigh: Math.min(MAX_FREQ, snapFreq + 100),
      source: "user",
    };
    setDraftPreview(preview);
    e.currentTarget.setPointerCapture(e.pointerId);
    draftPointerRef.current = { audioId: activeFileId, startTime: snapTime, startFreq: snapFreq };
    setIsDrawingDraft(true);
  }, [activeFileId, isDraggingDraft, isResizingDraft, tool, handleScrubFromSpectrogram, pointerToDomain, snapEnabled, t]);

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

  const handleDraftPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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
      freqHigh: Math.min(MAX_FREQ, Math.max(startFreq, curFreq)),
      source: "user",
    });
  }, [isDrawingDraft, pointerToDomain, scheduleDraftPreview, snapEnabled, t]);

  const handleDraftPointerUp = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
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
  }, [draftPreview, startDraft]);

  const scheduleDraftMove = useCallback((id: string, patch: Partial<ManualDraft>) => {
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
  }, [updateDraft]);

  const handleDraftDragPointerDown = useCallback((
    e: React.PointerEvent<HTMLButtonElement>,
    draft: ManualDraft,
  ) => {
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
  }, [isResizingDraft, selectDraft, tool, updateDraft]);

  const handleDraftDragPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
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
    const freqDelta = (-dy / Math.max(rect.height, 1)) * MAX_FREQ;

    const maxStart = Math.max(0, totalDuration - boxDuration);
    let startTime = Math.max(0, Math.min(drag.startTime + timeDelta, maxStart));
    let freqLow = Math.max(0, Math.min(drag.freqLow + freqDelta, MAX_FREQ - boxFreqRange));

    if (snapEnabled) {
      startTime = Math.round(startTime * 10) / 10;
      freqLow = Math.round(freqLow / 100) * 100;
      startTime = Math.max(0, Math.min(startTime, maxStart));
      freqLow = Math.max(0, Math.min(freqLow, MAX_FREQ - boxFreqRange));
    }

    const endTime = Math.min(totalDuration, startTime + boxDuration);
    const freqHigh = Math.min(MAX_FREQ, freqLow + boxFreqRange);

    scheduleDraftMove(drag.draftId, {
      startTime,
      endTime,
      freqLow,
      freqHigh,
    });
  }, [scheduleDraftMove, snapEnabled, totalDuration]);

  const handleDraftDragPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
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
  }, [pushHistory]);

  const scheduleDraftResize = useCallback((id: string, patch: Partial<ManualDraft>) => {
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
  }, [updateDraft]);

  const handleDraftResizePointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    draft: ManualDraft,
    handle: ResizeHandle,
  ) => {
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
  }, [selectDraft, tool, updateDraft]);

  const handleDraftResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const resize = resizeDraftRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    e.preventDefault();
    const area = spectrogramRef.current;
    if (!area || totalDuration <= 0) return;
    const rect = area.getBoundingClientRect();
    const dx = e.clientX - resize.pointerStartX;
    const dy = e.clientY - resize.pointerStartY;
    const timeDelta = (dx / Math.max(rect.width, 1)) * totalDuration;
    const freqDelta = (-dy / Math.max(rect.height, 1)) * MAX_FREQ;

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

    nextLow = Math.max(0, Math.min(nextLow, MAX_FREQ - MIN_DRAFT_FREQ_RANGE));
    nextHigh = Math.max(MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, MAX_FREQ));
    if (nextHigh - nextLow < MIN_DRAFT_FREQ_RANGE) {
      if (resize.handle === "nw" || resize.handle === "ne") {
        nextHigh = nextLow + MIN_DRAFT_FREQ_RANGE;
      } else {
        nextLow = nextHigh - MIN_DRAFT_FREQ_RANGE;
      }
    }
    nextLow = Math.max(0, Math.min(nextLow, MAX_FREQ - MIN_DRAFT_FREQ_RANGE));
    nextHigh = Math.max(nextLow + MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, MAX_FREQ));

    if (snapEnabled) {
      nextStart = Math.round(nextStart * 10) / 10;
      nextEnd = Math.round(nextEnd * 10) / 10;
      nextLow = Math.round(nextLow / 100) * 100;
      nextHigh = Math.round(nextHigh / 100) * 100;
      nextStart = Math.max(0, Math.min(nextStart, totalDuration - MIN_DRAFT_DURATION));
      nextEnd = Math.max(nextStart + MIN_DRAFT_DURATION, Math.min(nextEnd, totalDuration));
      nextLow = Math.max(0, Math.min(nextLow, MAX_FREQ - MIN_DRAFT_FREQ_RANGE));
      nextHigh = Math.max(nextLow + MIN_DRAFT_FREQ_RANGE, Math.min(nextHigh, MAX_FREQ));
    }

    scheduleDraftResize(resize.draftId, {
      startTime: nextStart,
      endTime: nextEnd,
      freqLow: nextLow,
      freqHigh: nextHigh,
    });
  }, [scheduleDraftResize, snapEnabled, totalDuration]);

  const handleDraftResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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
  }, [pushHistory]);

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

  useEffect(() => () => {
    if (draftUpdateRafRef.current !== null) {
      cancelAnimationFrame(draftUpdateRafRef.current);
    }
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
    }
    if (resizeRafRef.current !== null) {
      cancelAnimationFrame(resizeRafRef.current);
    }
  }, []);

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
      {/* ============================================================ */}
      {/*  TOP HEADER BAR                                              */}
      {/* ============================================================ */}
      <header className="h-14 shrink-0 bg-panel border-b border-border flex items-center justify-between px-3 md:px-5 overflow-x-auto">
        {/* Left cluster */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text tracking-tight hidden sm:inline">
              {t("brandName")}
            </span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <span className="text-xs text-text-secondary hidden md:inline">
            {t("project")}{" "}
            <span className="text-text font-medium">{t("projectName")}</span>
          </span>

          <span className="text-[10px] font-bold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full hidden lg:inline">
            {t("version")}
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 md:gap-5 shrink-0">
          {/* Mode indicator */}
          <div
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
              mode === "review"
                ? "bg-accent/15 text-accent"
                : "bg-warning/15 text-warning"
            }`}
          >
            {mode} {t("mode")}
          </div>

          <div className="h-5 w-px bg-border-light hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
            <span className="text-base">&#127942;</span>
            <span className="hidden sm:inline">{t("scoreLabel")}</span>
            <span className="text-text tabular-nums">{score.toLocaleString()}</span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-orange-400">
            <span className="text-base">&#128293;</span>
            <span>{t("streakLabel")}</span>
            <span className="text-text tabular-nums">{streak} {t("streakUnit")}</span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
            {t("arLabel")}
          </div>
        </div>
      </header>
      {(sessionError || suggestionError) && (
        <div className="shrink-0 bg-danger/10 border-b border-danger/30 px-4 py-2 text-xs text-danger">
          {sessionError ?? suggestionError}
        </div>
      )}

      {/* ============================================================ */}
      {/*  3-PANEL BODY                                                */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* ========================================================== */}
        {/*  LEFT PANEL - File List                                    */}
        {/* ========================================================== */}
        <aside className="hidden md:flex w-[280px] shrink-0 bg-panel border-r border-border flex-col">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder={t("filterPlaceholder")}
                value={fileFilter}
                onChange={(e) => setFileFilter(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex px-3 gap-1 mb-1">
            {(["all", "pending", "done"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-colors capitalize ${
                  filterTab === tab
                    ? "bg-primary/15 text-primary-light"
                    : "text-text-muted hover:text-text-secondary hover:bg-panel-light"
                }`}
              >
                {tab === "all" ? t("filterAll") : tab === "pending" ? t("filterPending") : t("filterDone")}
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {filteredFiles.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors relative group ${
                    isActive
                      ? "bg-surface border-l-2 border-l-warning"
                      : "hover:bg-panel-light border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="text-xs font-medium text-text truncate">
                        {file.filename}
                      </span>
                    </div>
                    <StatusBadge status={file.status} />
                  </div>
                  <div className="flex items-center gap-3 pl-5.5">
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {file.duration}
                    </span>
                    <span className="text-[10px] text-text-muted">{file.sampleRate}</span>
                    {fileProgressMap[file.id] && (
                      <span className="text-[10px] text-text-muted">
                        {fileProgressMap[file.id].reviewed}/{fileProgressMap[file.id].total}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="px-3 py-10 text-center">
                <p className="text-xs text-text-muted">{t("emptyFiles")}</p>
              </div>
            )}
          </div>

          {/* Daily Goal */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">{t("dailyGoal")}</span>
              <span className={`text-[11px] font-bold ${dailyProgress >= dailyGoal ? "text-accent" : "text-primary-light"}`}>
                {dailyProgress >= dailyGoal
                  ? t("dailyGoalComplete")
                  : t("dailyGoalProgress", { done: dailyProgress, goal: dailyGoal })}
              </span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${dailyProgress >= dailyGoal ? "bg-accent" : "bg-primary"}`}
                style={{
                  width: `${Math.min((dailyProgress / dailyGoal) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </aside>

        {/* ========================================================== */}
        {/*  CENTER PANEL - Spectrogram Canvas                         */}
        {/* ========================================================== */}
        <main className="flex-1 flex flex-col min-w-0 bg-canvas">
          {/* Toolbar */}
          <div className="h-11 shrink-0 bg-panel border-b border-border flex items-center px-3 gap-1">
            {tools.map((toolItem) => (
              <button
                key={toolItem.id}
                onClick={() => {
                  if (toolItem.id === "anchor") {
                    toggleSnap();
                    return;
                  }
                  setTool(toolItem.id);
                }}
                title={`${t(toolItem.labelKey)} (${toolItem.hotkey})`}
                className={`p-2 rounded-md transition-colors ${
                  toolItem.id === "anchor"
                    ? snapEnabled
                      ? "bg-warning/20 text-warning"
                      : "text-text-secondary hover:bg-panel-light hover:text-text"
                    : tool === toolItem.id
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-panel-light hover:text-text"
                }`}
              >
                <toolItem.icon className="w-4 h-4" />
              </button>
            ))}

            <div className="h-5 w-px bg-border-light mx-1" />

            {zoomTools.map((zt) => (
              <button
                key={zt.id}
                title={t(zt.labelKey)}
                onClick={() =>
                  setZoomLevel((prev) =>
                    zt.id === "zoom-in"
                      ? Math.min(prev + 0.25, 3.0)
                      : Math.max(prev - 0.25, 0.5),
                  )
                }
                className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
              >
                <zt.icon className="w-4 h-4" />
              </button>
            ))}

            <button
              onClick={() => setFitToSuggestion((prev) => !prev)}
              title={t("fitToSuggestion")}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                fitToSuggestion
                  ? "bg-primary/20 text-primary-light"
                  : "bg-surface text-text-muted hover:text-text-secondary"
              }`}
            >
              {t("fitShort")}
            </button>

            <div className="h-5 w-px bg-border-light mx-1" />

            {/* Undo / Redo */}
            <button
              onClick={undo}
              title={t("undoTitle")}
              className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              title={t("redoTitle")}
              className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {/* File indicator + progress + export */}
            <div className="ml-auto flex items-center gap-3 text-[11px] text-text-muted">
              <span className="text-text-secondary">
                {confirmedCount}/{totalCount} {t("tagged")}
              </span>
              <button
                onClick={handleSaveManualDrafts}
                className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-[10px] font-semibold transition-colors"
                title={t("manualSaveTitle")}
              >
                {t("manualSaveButton")}
              </button>
              <a
                href={endpoints.labeling.export(sessionId, "csv")}
                download
                className="px-2 py-1 rounded-md bg-surface hover:bg-panel-light text-text-secondary text-[10px] font-medium transition-colors"
              >
                {t("exportCsv")}
              </a>
              <a
                href={endpoints.labeling.export(sessionId, "json")}
                download
                className="px-2 py-1 rounded-md bg-surface hover:bg-panel-light text-text-secondary text-[10px] font-medium transition-colors"
              >
                {t("exportJson")}
              </a>
              <div className="flex items-center gap-2">
                <FileAudio className="w-3.5 h-3.5" />
                <span className="font-medium text-text-secondary">
                  {activeFile?.filename}
                </span>
              </div>
            </div>
          </div>

          {/* Spectrogram + Waveform area */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {/* Waveform preview */}
            <div className="h-20 shrink-0 bg-surface/50 border-b border-border/30 relative">
              {waveformData ? (
                <WaveformCanvas
                  peaks={waveformData.peaks}
                  currentTime={player.currentTime}
                  duration={totalDuration}
                  onSeek={player.canPlay ? (time) => seekTo(time, false) : () => {}}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] text-text-muted">
                  {t("waveformLoading")}
                </div>
              )}
            </div>
            {audioLoadError && (
              <div className="mx-3 mt-3 shrink-0 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger flex items-center justify-between gap-3">
                <span>{audioLoadError}</span>
                <button
                  onClick={() => setAudioRetryKey((k) => k + 1)}
                  className="px-2 py-1 rounded bg-danger/20 hover:bg-danger/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Spectrogram zone */}
            <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 origin-top-left"
              style={{
                transform: zoomLevel === 1 ? undefined : `scale(${zoomLevel})`,
                width: `${100 / zoomLevel}%`,
                height: `${100 / zoomLevel}%`,
              }}
            >
            {/* File complete toast */}
            {fileCompleteToast && (
              <div
                onClick={() => setFileCompleteToast(false)}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer"
                title="Click to dismiss"
              >
                <div className="bg-accent/90 text-white rounded-xl px-6 py-4 text-center shadow-lg">
                  <Check className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-bold">{isLastFile ? t("allFilesComplete") : t("fileComplete")}</p>
                  <p className="text-xs opacity-80 mt-1">{isLastFile ? t("returningToSessions") : t("movingToNext")}</p>
                </div>
              </div>
            )}
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between py-4 z-10 pointer-events-none">
              {["20kHz", "15kHz", "10kHz", "5kHz", "0Hz"].map((label) => (
                <span key={label} className="text-[10px] text-text-muted/70 font-mono text-right pr-2">
                  {label}
                </span>
              ))}
            </div>

            {/* Spectrogram gradient background */}
            <div
              ref={spectrogramRef}
              onPointerDown={handleDraftPointerDown}
              onPointerMove={handleDraftPointerMove}
              onPointerUp={handleDraftPointerUp}
              onPointerLeave={handleDraftPointerUp}
              className={`absolute top-0 left-12 right-0 bottom-6 bg-gradient-to-b from-indigo-950 via-purple-900 to-amber-950 opacity-90 ${
                tool === "box" ? "cursor-crosshair" : "cursor-pointer"
              }`}
            >
              {/* Horizontal grid lines */}
              <div className="absolute inset-0">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute left-0 right-0 border-t border-white/5" style={{ top: `${pct}%` }} />
                ))}
              </div>
              {/* Vertical grid lines */}
              <div className="absolute inset-0">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${pct}%` }} />
                ))}
              </div>
              {/* Scan-line noise pattern */}
              <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
              {/* Color intensity band (simulating frequency energy) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-60" />
              <div className="absolute left-[25%] right-[30%] top-[30%] bottom-[40%] bg-orange-500/8 rounded-full blur-3xl" />
              <div className="absolute left-[55%] right-[10%] top-[55%] bottom-[15%] bg-red-500/6 rounded-full blur-3xl" />
              {/* Energy bands from suggestion regions */}
              {suggestions.map((s) => {
                const boxPos = suggestionBoxStyle(s, totalDuration);
                const energyClass =
                  s.status === "pending"
                    ? "bg-orange-400/10"
                    : s.status === "confirmed"
                      ? "bg-accent/10"
                      : s.status === "rejected"
                        ? "bg-danger/10"
                        : "bg-cyan-400/10";
                return (
                  <div
                    key={`energy-${s.id}`}
                    className={`absolute ${energyClass} blur-md pointer-events-none`}
                    style={{
                      left: boxPos.left,
                      width: boxPos.width,
                      top: "6%",
                      bottom: "6%",
                    }}
                  />
                );
              })}
            </div>

            {/* Dynamic annotation boxes from suggestions */}
            {suggestions.map((s) => {
              const sc = statusColors[s.status];
              const isSelected = s.id === selectedSuggestionId;
              const boxPos = suggestionBoxStyle(s, totalDuration);
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSuggestion(s.id)}
                  className={`absolute border-2 rounded-sm z-20 transition-all duration-200 ${
                    sc.border
                  } ${sc.dashed ? "border-dashed" : ""} ${
                    isSelected
                      ? "ring-2 ring-white/30 shadow-lg shadow-white/10"
                      : "hover:ring-1 hover:ring-white/20"
                  }`}
                  style={{
                    left: `calc(48px + ${boxPos.left})`,
                    top: boxPos.top,
                    width: boxPos.width,
                    height: boxPos.height,
                    minWidth: "40px",
                    minHeight: "20px",
                  }}
                >
                  {/* Tag label */}
                  <div className={`absolute -top-5 left-0 ${sc.tagBg} text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 whitespace-nowrap`}>
                    {s.status === "pending" && <Sparkles className="w-2.5 h-2.5" />}
                    {s.status === "confirmed" && <Check className="w-2.5 h-2.5" />}
                    {s.status === "rejected" && <X className="w-2.5 h-2.5" />}
                    {s.status === "corrected" && <Wrench className="w-2.5 h-2.5" />}
                    <span title={s.label}>{s.label.slice(0, 18)}</span>
                  </div>
                  {/* Corner handles */}
                  {isSelected && (
                    <>
                      <div className={`absolute -top-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -top-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                    </>
                  )}
                  {/* Confidence badge */}
                  <span className="absolute -bottom-5 left-0 text-[9px] font-mono font-bold tabular-nums" style={{ color: "inherit" }}>
                    <span className={sc.label}>{s.confidence}%</span>
                  </span>
                </button>
              );
            })}

            {/* Manual draft boxes */}
            {manualDrafts.map((draft) => {
              const pos = suggestionBoxStyle(draft, totalDuration);
              const isSelected = draft.id === selectedDraftId;
              return (
                <button
                  key={draft.id}
                  onClick={() => selectDraft(draft.id)}
                  onPointerDown={(e) => handleDraftDragPointerDown(e, draft)}
                  onPointerMove={handleDraftDragPointerMove}
                  onPointerUp={handleDraftDragPointerUp}
                  onPointerCancel={handleDraftDragPointerUp}
                  className={`absolute border-2 rounded-sm z-20 transition-all ${
                    isSelected
                      ? "border-cyan-300 bg-cyan-300/10 ring-2 ring-cyan-100/50"
                      : "border-cyan-400/80 bg-cyan-400/10 hover:border-cyan-300"
                  }`}
                  style={{
                    left: `calc(48px + ${pos.left})`,
                    top: pos.top,
                    width: pos.width,
                    height: pos.height,
                    minWidth: "18px",
                    minHeight: "14px",
                  }}
                >
                  <div className="absolute -top-5 left-0 bg-cyan-300/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                    {t("manualDraftTag")}
                  </div>
                  {isSelected && tool === "select" && (
                    <>
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nwse-resize"
                        onPointerDown={(e) => handleDraftResizePointerDown(e, draft, "nw")}
                        onPointerMove={handleDraftResizePointerMove}
                        onPointerUp={handleDraftResizePointerUp}
                        onPointerCancel={handleDraftResizePointerUp}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nesw-resize"
                        onPointerDown={(e) => handleDraftResizePointerDown(e, draft, "ne")}
                        onPointerMove={handleDraftResizePointerMove}
                        onPointerUp={handleDraftResizePointerUp}
                        onPointerCancel={handleDraftResizePointerUp}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nesw-resize"
                        onPointerDown={(e) => handleDraftResizePointerDown(e, draft, "sw")}
                        onPointerMove={handleDraftResizePointerMove}
                        onPointerUp={handleDraftResizePointerUp}
                        onPointerCancel={handleDraftResizePointerUp}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nwse-resize"
                        onPointerDown={(e) => handleDraftResizePointerDown(e, draft, "se")}
                        onPointerMove={handleDraftResizePointerMove}
                        onPointerUp={handleDraftResizePointerUp}
                        onPointerCancel={handleDraftResizePointerUp}
                      />
                    </>
                  )}
                </button>
              );
            })}
            {draftPreview && (() => {
              const pos = suggestionBoxStyle(draftPreview, totalDuration);
              return (
                <div
                  className="absolute border-2 border-cyan-200 bg-cyan-300/15 rounded-sm z-20 pointer-events-none"
                  style={{
                    left: `calc(48px + ${pos.left})`,
                    top: pos.top,
                    width: pos.width,
                    height: pos.height,
                    minWidth: "18px",
                    minHeight: "14px",
                  }}
                />
              );
            })()}

            {/* Playback cursor line */}
            <div className="absolute top-0 bottom-6 w-px bg-white/60 z-30" style={{ left: `calc(48px + ${playbackPct}%)` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-white/90 font-mono whitespace-nowrap">
                {formatTimecode(player.currentTime)}
              </div>
            </div>

            {/* Loop markers + band */}
            {loopState.start !== null && (
              <div
                className="absolute top-0 bottom-6 w-px bg-warning/80 z-30"
                style={{ left: `calc(48px + ${(loopState.start / totalDuration) * 100}%)` }}
              />
            )}
            {loopState.end !== null && (
              <div
                className="absolute top-0 bottom-6 w-px bg-warning/80 z-30"
                style={{ left: `calc(48px + ${(loopState.end / totalDuration) * 100}%)` }}
              />
            )}
            {loopState.start !== null && loopState.end !== null && loopState.end > loopState.start && (
              <div
                className="absolute top-0 bottom-6 bg-warning/10 border-y border-warning/30 z-20 pointer-events-none"
                style={{
                  left: `calc(48px + ${(loopState.start / totalDuration) * 100}%)`,
                  width: `${((loopState.end - loopState.start) / totalDuration) * 100}%`,
                }}
              />
            )}

            {/* Time axis (bottom) */}
            <div className="absolute left-12 right-0 bottom-0 h-6 flex items-center justify-between px-2 pointer-events-none">
              {Array.from({ length: 6 }, (_, i) => {
                const timeVal = (totalDuration / 5) * i;
                const m = Math.floor(timeVal / 60);
                const sec = Math.floor(timeVal % 60);
                return (
                  <span key={i} className="text-[9px] text-text-muted/60 font-mono tabular-nums">
                    {String(m).padStart(2, "0")}:{String(sec).padStart(2, "0")}
                  </span>
                );
              })}
            </div>

            {/* Annotation legend */}
            <div className="absolute top-2 right-3 z-30 flex gap-2">
              {(["pending", "confirmed", "rejected", "corrected"] as const).map((st) => {
                const c = statusColors[st];
                return (
                  <div key={st} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-sm ${c.bg} ${c.dashed ? "opacity-70" : ""}`} />
                    <span className="text-[9px] text-text-muted capitalize">{t(`legend${st.charAt(0).toUpperCase() + st.slice(1)}`)}</span>
                  </div>
                );
              })}
            </div>

            {/* State HUD */}
            <div className="absolute top-8 right-3 z-30 rounded-lg border border-white/10 bg-black/45 backdrop-blur-sm px-2.5 py-2 text-[10px] space-y-1 min-w-[180px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-muted">{t("stateHudFit")}</span>
                <span className={fitToSuggestion ? "text-accent font-semibold" : "text-text-secondary"}>{fitToSuggestion ? "ON" : "OFF"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-muted">{t("stateHudZoom")}</span>
                <span className="text-text-secondary font-mono">{zoomLevel.toFixed(2)}x</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-muted">{t("stateHudLoop")}</span>
                <span className={`${loopState.enabled ? "text-warning" : "text-text-secondary"} font-mono`}>{loopRangeLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-muted">{t("stateHudSaveTarget")}</span>
                <span className="text-cyan-200 font-mono">
                  {selectedDraftId ? t("stateHudSelectedDraft") : t("stateHudAllDrafts")}
                </span>
              </div>
              {loopHudWarning && (
                <p className="text-danger text-[9px]">{t("loopRequireBounds")}</p>
              )}
            </div>

            {/* Canvas helper hints */}
            <div className="absolute bottom-8 left-3 z-30 bg-black/55 text-[9px] text-text-muted px-2 py-1 rounded font-mono">
              {t("clickDragSeekHint")}
            </div>
            {showFitToast && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-accent/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded">
                {t("autoFitApplied")}
              </div>
            )}

            {/* Hotkey hint overlay */}
            <div className="absolute bottom-8 right-3 z-30 flex gap-1.5">
              {[
                { key: "O", labelKey: "hintConfirm" },
                { key: "X", labelKey: "hintReject" },
                { key: "R", labelKey: "hintBox" },
                { key: "Ctrl+Z", labelKey: "hintUndo" },
                { key: "Ctrl+Shift+Z", labelKey: "hintRedo" },
                { key: "Ctrl+Enter", labelKey: "hintManualSave" },
                { key: "I/P/L", labelKey: "hintLoop" },
              ].map((hint) => (
                <div
                  key={hint.key}
                  className="bg-black/60 backdrop-blur-sm text-[9px] text-text-muted px-1.5 py-0.5 rounded font-mono"
                >
                  <span className="text-text-secondary font-bold">{hint.key}</span>{" "}
                  {t(hint.labelKey)}
                </div>
              ))}
            </div>
            </div>
          </div>{/* /spectrogram zone */}
          </div>{/* /spectrogram + waveform area */}

          {/* Audio Player Controls */}
          <div className="h-14 shrink-0 bg-panel border-t border-border flex items-center px-4 gap-4">
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={player.toggle}
                disabled={!player.canPlay}
                className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {player.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-text-secondary tabular-nums">
              <span className="text-text font-medium">
                {(() => {
                  const cur = player.currentTime;
                  const m = Math.floor(cur / 60);
                  const s = Math.floor(cur % 60);
                  const ms = Math.floor((cur % 1) * 1000);
                  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
                })()}
              </span>
              <span className="mx-1 text-text-muted">/</span>
              <span>{activeFile?.duration ?? "00:00"}</span>
            </div>

            <div className="flex-1" />

            <button className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors">
              <Lock className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => player.setPlaybackRate(1.0)}
              title={t("playbackSpeedTitle")}
              className="text-[11px] font-medium text-text-secondary bg-surface px-2 py-1 rounded-md hover:bg-panel-light transition-colors"
            >
              {player.playbackRate.toFixed(2)}x
            </button>

            <button
              onClick={handleSetLoopStart}
              className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors"
              title={t("loopIn")}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSetLoopEnd}
              className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors"
              title={t("loopOut")}
            >
              <Flag className="w-3.5 h-3.5 rotate-180" />
            </button>

            <button
              onClick={handleToggleLoop}
              className={`p-1.5 rounded-md transition-colors ${
                loopState.enabled ? "text-accent bg-accent/10" : "text-text-muted hover:text-text-secondary"
              }`}
              title={t("loopToggle")}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleAddBookmark(bookmarkPresets[0])}
              className="p-1.5 rounded-md text-text-muted hover:text-text-secondary transition-colors"
              title={t("bookmarkAdd")}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => player.setVolume(player.volume > 0 ? 0 : 0.75)}
                disabled={!player.canPlay}
                className="p-0.5 rounded text-text-muted hover:text-text-secondary transition-colors"
                title={player.volume > 0 ? t("mute") : t("unmute")}
              >
                {player.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={player.volume}
                onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                disabled={!player.canPlay}
                className="w-20 h-1 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={t("volumeTitle", { percent: Math.round(player.volume * 100) })}
              />
            </div>
          </div>

          {/* Mobile-only quick action bar */}
          <div className="flex md:hidden items-center justify-between px-4 py-2 bg-panel border-t border-border shrink-0">
            <div className="text-xs text-text-muted">
              {activeSuggestion ? (
                <span>{t("suggestionFormat", { label: activeSuggestion.label, confidence: activeSuggestion.confidence })}</span>
              ) : (
                <span>{t("noSuggestionSelected")}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" /> {t("okButton")}
              </button>
              <button
                onClick={handleReject}
                disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" /> {t("ngButton")}
              </button>
            </div>
          </div>
        </main>

        {/* ========================================================== */}
        {/*  RIGHT PANEL - AI Analysis & Properties                    */}
        {/* ========================================================== */}
        <aside className="hidden md:flex w-[320px] shrink-0 bg-panel border-l border-border flex-col overflow-y-auto">
          {/* ---- AI Analysis Header ---- */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-light" />
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              {t("aiAnalysis")}
            </h2>
            <div className="ml-auto flex items-center gap-1.5">
              {pendingCount > 0 && (
                <span className="text-[9px] font-bold bg-orange-400/20 text-orange-400 px-2 py-0.5 rounded-full">
                  {t("pendingCount", { count: pendingCount })}
                </span>
              )}
              {confirmedCount > 0 && (
                <span className="text-[9px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                  {t("confirmedCount", { count: confirmedCount })}
                </span>
              )}
              {totalCount - pendingCount - confirmedCount > 0 && (
                <span className="text-[9px] font-bold bg-danger/20 text-danger px-2 py-0.5 rounded-full">
                  {t("fixedCount", { count: totalCount - pendingCount - confirmedCount })}
                </span>
              )}
            </div>
          </div>

          {/* ---- Review Mode: Suggestion Card ---- */}
          {mode === "review" && activeSuggestion && (
            <div className="p-4 border-b border-border">
              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text">{activeSuggestion.label}</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">{t("aiDetectedAnomaly")}</p>
                    <p className="text-[10px] text-text-muted mt-1">{t("aiActionGuide")}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary-light tabular-nums">
                      {t("confidence", { confidence: activeSuggestion.confidence })}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-panel rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${activeSuggestion.confidence}%` }}
                  />
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
                  {activeSuggestion.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-panel-light hover:bg-border text-danger text-xs font-semibold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t("rejectButton")}
                    <kbd className="text-[9px] text-text-muted ml-1 bg-panel px-1 rounded">X</kbd>
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t("confirmButton")}
                    <kbd className="text-[9px] text-white/60 ml-1 bg-white/10 px-1 rounded">O</kbd>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---- Edit Mode: Apply Fix Card ---- */}
          {mode === "edit" && rejectedSuggestion && (
            <div className="p-4 border-b border-border">
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-warning" />
                  <h3 className="text-sm font-bold text-warning">{t("editMode")}</h3>
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                  {t("rejectedPrefix")}<span className="text-text font-medium">{rejectedSuggestion.label}</span>
                </p>
                <p className="text-[11px] text-text-muted mb-4">
                  {t("editInstruction")}
                </p>

                <button
                  onClick={handleApplyFix}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning hover:bg-warning/90 text-black text-xs font-bold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("applyFix")}
                  <kbd className="text-[9px] text-black/50 ml-1 bg-black/10 px-1 rounded">F</kbd>
                </button>
              </div>
            </div>
          )}

          {/* ---- No pending suggestions ---- */}
          {mode === "review" && !activeSuggestion && (
            <div className="p-4 border-b border-border">
              <div className="bg-surface rounded-xl p-6 flex flex-col items-center text-center">
                <Sparkles className="w-6 h-6 text-text-muted mb-2" />
                <p className="text-xs text-text-muted">{t("allProcessed")}</p>
                <p className="text-[10px] text-text-muted mt-1">
                  {t("processedCounts", { confirmed: confirmedCount, fixed: totalCount - confirmedCount - pendingCount })}
                </p>
              </div>
            </div>
          )}

          {/* ---- Noise Reduction Card ---- */}
          <div className="px-4 py-3 border-b border-border">
            <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4 text-primary-light" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-text">{t("noiseReductionTitle")}</h4>
                <p className="text-[10px] text-text-muted mt-0.5">{t("noiseReductionDesc")}</p>
                <p className="text-[10px] text-text-muted/80 mt-0.5">{t("noiseReductionRole")}</p>
              </div>
              <button className="text-[11px] font-bold text-primary-light hover:text-primary transition-colors shrink-0">
                {t("noiseReductionApply")}
              </button>
            </div>
          </div>

          {/* ---- Properties Section ---- */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
              {t("properties")}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sensorId")}</label>
                <input type="text" value="N/A" readOnly className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sampleRate")}</label>
                <input type="text" value={activeFile?.sampleRate || "N/A"} readOnly className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
              </div>
            </div>
            <div className="mt-2.5">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("duration")}</label>
              <input type="text" value={activeFile?.duration || "N/A"} readOnly className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
            </div>
            <div className="mt-2.5">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("capturedAt")}</label>
              <input type="text" value="N/A" readOnly className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
            </div>
          </div>

          {/* ---- Notes Section ---- */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{t("notes")}</h3>
            <textarea
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            />
          </div>

          <BookmarksPanel
            bookmarks={bookmarks}
            presets={bookmarkPresets}
            onAdd={handleAddBookmark}
            onSeek={(time) => seekTo(time, true)}
            onRemove={removeBookmark}
          />

          <ActionHistoryPanel
            items={history}
            onClear={clearHistory}
            onReplay={handleReplayHistory}
            collapsed={historyCollapsed}
            onToggleCollapsed={() => setHistoryCollapsed((prev) => !prev)}
            undoHint={t("historyUndoHint")}
          />

          {/* ---- Save & Next Button ---- */}
          <div className="p-4 mt-auto">
            <button
              onClick={handleNextFile}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {t("saveAndNext")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
