"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AudioLines,
  Search,
  MousePointer2,
  Pencil,
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
  Sparkles,
  X,
  Check,
  Filter,
  FileAudio,
  ChevronRight,
  Undo2,
  Redo2,
  Wrench,
} from "lucide-react";

import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useScoreStore } from "@/lib/store/score-store";
import { useSessionStore } from "@/lib/store/session-store";
import { loadSavedProgress, useAutosave } from "@/lib/hooks/use-autosave";
import { useWaveform } from "@/lib/hooks/use-waveform";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import WaveformCanvas from "@/components/domain/labeling/WaveformCanvas";
import { endpoints } from "@/lib/api/endpoints";
import type { DrawTool, AudioFile, AISuggestion, SuggestionStatus, Session } from "@/types";

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

function suggestionBoxStyle(s: AISuggestion, totalDuration: number) {
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
const tools: { id: DrawTool; icon: typeof MousePointer2; label: string; hotkey: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select", hotkey: "S" },
  { id: "brush", icon: Pencil, label: "Brush", hotkey: "B" },
  { id: "anchor", icon: Anchor, label: "Anchor", hotkey: "A" },
  { id: "box", icon: Square, label: "Box", hotkey: "R" },
];

const zoomTools = [
  { id: "zoom-in" as const, icon: ZoomIn, label: "Zoom In" },
  { id: "zoom-out" as const, icon: ZoomOut, label: "Zoom Out" },
];

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    wip: { label: "WIP", cls: "bg-warning/20 text-warning" },
    pending: { label: "PENDING", cls: "bg-primary/20 text-primary-light" },
    done: { label: "DONE", cls: "bg-accent/20 text-accent" },
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
    suggestions,
    selectedSuggestionId,
    confirmSuggestion,
    rejectSuggestion,
    applyFix,
    undo,
    redo,
    loadSuggestions,
    restoreSuggestions,
    selectSuggestion,
  } = useAnnotationStore();

  const { score, streak, addScore, addConfirm, addFix, incrementStreak } =
    useScoreStore();

  const {
    files,
    currentFileId,
    setCurrentFile,
    setCurrentSessionById,
    setSessions,
    setFiles,
  } = useSessionStore();

  /* ----- Local UI state ------------------------------------------- */
  const [fileFilter, setFileFilter] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "done">("all");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  /* ----- Derived -------------------------------------------------- */
  const audioFiles: AudioFile[] = files;
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const activeFileId = currentFileId ?? audioFiles[0]?.id ?? null;
  const activeFile = audioFiles.find((f) => f.id === activeFileId) ?? audioFiles[0];
  const parsedDuration = activeFile ? Math.max(parseDurationToSeconds(activeFile.duration), 1) : 600;

  /* ----- Audio player + Waveform hooks ----------------------------- */
  const audioUrl: string | null = normalizeAudioUrl(activeFile?.audioUrl);
  const player = useAudioPlayer(audioUrl, parsedDuration);
  const { data: waveformData } = useWaveform(audioUrl);

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
    suggestions.find((s) => s.id === selectedSuggestionId && s.status === "pending") ??
    suggestions.find((s) => s.status === "pending");

  const rejectedSuggestion =
    mode === "edit"
      ? suggestions.find((s) => s.id === selectedSuggestionId && s.status === "rejected")
      : null;

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const confirmedCount = suggestions.filter((s) => s.status === "confirmed").length;
  const totalCount = suggestions.length;

  /* ----- Session init --------------------------------------------- */
  useEffect(() => {
    if (!sessionId) return;
    setSessionError(null);
    const loadSessionData = async () => {
      try {
        const [sessionsRes, filesRes] = await Promise.all([
          fetch(endpoints.sessions.list),
          fetch(endpoints.sessions.files(sessionId)),
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
        setFiles(filesData);

        const targetSession = setCurrentSessionById(sessionId);
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
    const loadSuggestionData = async () => {
      try {
        const res = await fetch(endpoints.labeling.suggestions(sessionId));
        if (!res.ok) {
          throw new Error("Failed to load suggestions");
        }
        const all = (await res.json()) as AISuggestion[];
        const filtered = all.filter((s) => s.audioId === activeFileId);
        loadSuggestions(filtered);

        const saved = loadSavedProgress(activeFileId);
        if (saved?.suggestions?.length) {
          restoreSuggestions(saved.suggestions);
        }
      } catch (err) {
        loadSuggestions([]);
        setSuggestionError((err as Error).message || "Failed to load suggestions");
      }
    };

    void loadSuggestionData();
  }, [activeFileId, loadSuggestions, restoreSuggestions, sessionId]);

  /* ----- Handlers ------------------------------------------------- */
  const handleConfirm = useCallback(() => {
    const result = confirmSuggestion();
    if (result) {
      addScore(result.points);
      addConfirm();
      incrementStreak();
    }
  }, [confirmSuggestion, addScore, addConfirm, incrementStreak]);

  const handleReject = useCallback(() => {
    rejectSuggestion();
  }, [rejectSuggestion]);

  const handleApplyFix = useCallback(() => {
    const result = applyFix();
    if (result) {
      addScore(result.points);
      addFix();
      incrementStreak();
    }
  }, [applyFix, addScore, addFix, incrementStreak]);

  function handleFileClick(file: AudioFile) {
    setCurrentFile(file.id);
  }

  function handleNextFile() {
    if (!activeFileId) return;
    const idx = audioFiles.findIndex((f) => f.id === activeFileId);
    const nextFile = audioFiles[idx + 1];
    if (nextFile) {
      setCurrentFile(nextFile.id);
    }
  }

  /* ----- Hotkeys -------------------------------------------------- */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case "o":
          if (mode === "review") handleConfirm();
          break;
        case "x":
          if (mode === "review") handleReject();
          break;
        case "b":
          setTool("brush");
          break;
        case "e":
          setTool("eraser");
          break;
        case "r":
          setTool("box");
          break;
        case "s":
          if (!e.ctrlKey && !e.metaKey) setTool("select");
          break;
        case "f":
          if (mode === "edit") handleApplyFix();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, handleConfirm, handleReject, handleApplyFix, undo, redo, setTool]);

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
              Smart Spectro-Tagging
            </span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <span className="text-xs text-text-secondary hidden md:inline">
            Project:{" "}
            <span className="text-text font-medium">Turbine_Vibration_X42</span>
          </span>

          <span className="text-[10px] font-bold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full hidden lg:inline">
            v2.4.0
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
            {mode} mode
          </div>

          <div className="h-5 w-px bg-border-light hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
            <span className="text-base">&#127942;</span>
            <span className="hidden sm:inline">SCORE</span>
            <span className="text-text tabular-nums">{score.toLocaleString()}</span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-orange-400">
            <span className="text-base">&#128293;</span>
            <span>STREAK</span>
            <span className="text-text tabular-nums">{streak} Days</span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
            AR
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
                placeholder="Filter files..."
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
                {tab === "all" ? "All" : tab === "pending" ? "Pending" : "Done"}
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
                  </div>
                </button>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="px-3 py-10 text-center">
                <p className="text-xs text-text-muted">No files found for this session.</p>
              </div>
            )}
          </div>

          {/* Daily Goal */}
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">Daily Goal</span>
              <span className="text-[11px] font-bold text-primary-light">
                {totalCount > 0 ? Math.round(((confirmedCount + (totalCount - pendingCount - confirmedCount)) / totalCount) * 100) : 0}%
              </span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? ((confirmedCount + (totalCount - pendingCount - confirmedCount)) / totalCount) * 100 : 0}%`,
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
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.hotkey})`}
                className={`p-2 rounded-md transition-colors ${
                  tool === t.id
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-panel-light hover:text-text"
                }`}
              >
                <t.icon className="w-4 h-4" />
              </button>
            ))}

            <div className="h-5 w-px bg-border-light mx-1" />

            {zoomTools.map((t) => (
              <button
                key={t.id}
                title={t.label}
                className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
              >
                <t.icon className="w-4 h-4" />
              </button>
            ))}

            <div className="h-5 w-px bg-border-light mx-1" />

            {/* Undo / Redo */}
            <button
              onClick={undo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {/* File indicator + progress */}
            <div className="ml-auto flex items-center gap-3 text-[11px] text-text-muted">
              <span className="text-text-secondary">
                {confirmedCount}/{totalCount} tagged
              </span>
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
            {/* Waveform preview (real data / synthetic fallback) */}
            {waveformData && (
              <div className="h-20 shrink-0 bg-surface/50 border-b border-border/30 relative">
                <WaveformCanvas
                  peaks={waveformData.peaks}
                  currentTime={player.currentTime}
                  duration={totalDuration}
                  onSeek={player.seek}
                />
              </div>
            )}

            {/* Spectrogram zone */}
            <div className="flex-1 relative overflow-hidden">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between py-4 z-10 pointer-events-none">
              {["20kHz", "15kHz", "10kHz", "5kHz", "0Hz"].map((label) => (
                <span key={label} className="text-[10px] text-text-muted/70 font-mono text-right pr-2">
                  {label}
                </span>
              ))}
            </div>

            {/* Spectrogram gradient background */}
            <div className="absolute top-0 left-12 right-0 bottom-6 bg-gradient-to-b from-indigo-950 via-purple-900 to-amber-950 opacity-90">
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
            </div>

            {/* Dynamic annotation boxes from suggestions */}
            {suggestions.map((s) => {
              const sc = statusColors[s.status];
              const isSelected = s.id === selectedSuggestionId;
              const boxPos = suggestionBoxStyle(s, totalDuration);
              return (
                <button
                  key={s.id}
                  onClick={() => selectSuggestion(s.id)}
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
                    {s.label.slice(0, 18)}
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

            {/* Playback cursor line */}
            <div className="absolute top-0 bottom-6 w-px bg-white/60 z-30" style={{ left: `calc(48px + ${playbackPct}%)` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
            </div>

            {/* Time axis (bottom) */}
            <div className="absolute left-12 right-0 bottom-0 h-6 flex items-center justify-between px-2 pointer-events-none">
              {Array.from({ length: 6 }, (_, i) => {
                const t = (totalDuration / 5) * i;
                const m = Math.floor(t / 60);
                const sec = Math.floor(t % 60);
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
                    <span className="text-[9px] text-text-muted capitalize">{st}</span>
                  </div>
                );
              })}
            </div>

            {/* Hotkey hint overlay */}
            <div className="absolute bottom-8 right-3 z-30 flex gap-1.5">
              {[
                { key: "O", label: "Confirm" },
                { key: "X", label: "Reject" },
                { key: "B", label: "Brush" },
                { key: "R", label: "Box" },
                { key: "^Z", label: "Undo" },
              ].map((hint) => (
                <div
                  key={hint.key}
                  className="bg-black/60 backdrop-blur-sm text-[9px] text-text-muted px-1.5 py-0.5 rounded font-mono"
                >
                  <span className="text-text-secondary font-bold">{hint.key}</span>{" "}
                  {hint.label}
                </div>
              ))}
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
                className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
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

            <span className="text-[11px] font-medium text-text-secondary bg-surface px-2 py-1 rounded-md">
              1.0x
            </span>

            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-text-muted" />
              <div className="w-20 h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary rounded-full" />
              </div>
            </div>
          </div>

          {/* Mobile-only quick action bar */}
          <div className="flex md:hidden items-center justify-between px-4 py-2 bg-panel border-t border-border shrink-0">
            <div className="text-xs text-text-muted">
              {activeSuggestion ? (
                <span><span className="font-bold text-text">{activeSuggestion.label}</span> ??{(activeSuggestion.confidence * 100).toFixed(0)}%</span>
              ) : (
                <span>No suggestion selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" /> OK
              </button>
              <button
                onClick={handleReject}
                disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5" /> NG
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
              AI Analysis
            </h2>
            {pendingCount > 0 && (
              <span className="ml-auto text-[9px] font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full uppercase">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* ---- Review Mode: Suggestion Card ---- */}
          {mode === "review" && activeSuggestion && (
            <div className="p-4 border-b border-border">
              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text">{activeSuggestion.label}</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">AI Detected Anomaly</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary-light tabular-nums">
                      {activeSuggestion.confidence}%
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
                    Reject
                    <kbd className="text-[9px] text-text-muted ml-1 bg-panel px-1 rounded">X</kbd>
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
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
                  <h3 className="text-sm font-bold text-warning">Edit Mode</h3>
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
                  Rejected: <span className="text-text font-medium">{rejectedSuggestion.label}</span>
                </p>
                <p className="text-[11px] text-text-muted mb-4">
                  Draw the correct annotation region on the spectrogram, then apply the fix.
                </p>

                <button
                  onClick={handleApplyFix}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning hover:bg-warning/90 text-black text-xs font-bold transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Fix (+20 pts)
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
                <p className="text-xs text-text-muted">All suggestions processed</p>
                <p className="text-[10px] text-text-muted mt-1">
                  {confirmedCount} confirmed, {totalCount - confirmedCount - pendingCount} fixed
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
                <h4 className="text-xs font-semibold text-text">Apply Noise Reduction?</h4>
                <p className="text-[10px] text-text-muted mt-0.5">Filters background hum (-12dB)</p>
              </div>
              <button className="text-[11px] font-bold text-primary-light hover:text-primary transition-colors shrink-0">
                APPLY
              </button>
            </div>
          </div>

          {/* ---- Properties Section ---- */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
              Properties
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Sensor ID</label>
                <input type="text" defaultValue="TURB-X42-A" className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Sample Rate</label>
                <input type="text" defaultValue="44,100 Hz" className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
            </div>
            <div className="mt-2.5">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Duration</label>
              <input type="text" defaultValue="00:08:22.00" className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
            </div>
            <div className="mt-2.5">
              <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Captured At</label>
              <input type="text" defaultValue="Oct 24, 2023 - 14:30 UTC" className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
            </div>
          </div>

          {/* ---- Notes Section ---- */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Notes</h3>
            <textarea
              placeholder="Add annotation notes here..."
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            />
          </div>

          {/* ---- Save & Next Button ---- */}
          <div className="p-4 mt-auto">
            <button
              onClick={handleNextFile}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Save &amp; Next File
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
