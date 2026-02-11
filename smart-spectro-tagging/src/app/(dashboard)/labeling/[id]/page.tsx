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
import type { DrawTool, AudioFile } from "@/types";

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
  } = useAnnotationStore();

  const { score, streak, addScore, addConfirm, addFix, incrementStreak } =
    useScoreStore();

  const { files, currentFileId, setCurrentFile, setCurrentSessionById } =
    useSessionStore();

  /* ----- Local UI state ------------------------------------------- */
  const [fileFilter, setFileFilter] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "done">("all");
  const [isPlaying, setIsPlaying] = useState(false);

  /* ----- Derived -------------------------------------------------- */
  const audioFiles: AudioFile[] = files;
  const activeFileId = currentFileId ?? audioFiles[0]?.id ?? null;
  const activeFile = audioFiles.find((f) => f.id === activeFileId) ?? audioFiles[0];

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
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!sessionId) return;
    const targetSession = setCurrentSessionById(sessionId);
    if (!targetSession) {
      router.replace("/sessions");
    }
  }, [params.id, router, setCurrentSessionById]);

  useEffect(() => {
    if (!activeFileId) return;
    loadSuggestions(activeFileId);
  }, [activeFileId, loadSuggestions]);

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
      <header className="h-14 shrink-0 bg-panel border-b border-border flex items-center justify-between px-5">
        {/* Left cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text tracking-tight">
              Smart Spectro-Tagging
            </span>
          </div>

          <div className="h-5 w-px bg-border-light" />

          <span className="text-xs text-text-secondary">
            Project:{" "}
            <span className="text-text font-medium">Turbine_Vibration_X42</span>
          </span>

          <span className="text-[10px] font-bold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full">
            v2.4.0
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-5">
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

          <div className="h-5 w-px bg-border-light" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
            <span className="text-base">&#127942;</span>
            <span>SCORE</span>
            <span className="text-text tabular-nums">{score.toLocaleString()}</span>
          </div>

          <div className="h-5 w-px bg-border-light" />

          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
            <span className="text-base">&#128293;</span>
            <span>STREAK</span>
            <span className="text-text tabular-nums">{streak} Days</span>
          </div>

          <div className="h-5 w-px bg-border-light" />

          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
            AR
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  3-PANEL BODY                                                */}
      {/* ============================================================ */}
      <div className="flex flex-1 min-h-0">
        {/* ========================================================== */}
        {/*  LEFT PANEL - File List                                    */}
        {/* ========================================================== */}
        <aside className="w-[280px] shrink-0 bg-panel border-r border-border flex flex-col">
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

          {/* Spectrogram area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4 z-10 pointer-events-none">
              {["20kHz", "15kHz", "10kHz", "5kHz", "0Hz"].map((label) => (
                <span key={label} className="text-[10px] text-text-muted/70 font-mono text-right pr-2">
                  {label}
                </span>
              ))}
            </div>

            {/* Spectrogram gradient background */}
            <div className="absolute inset-0 ml-12 bg-gradient-to-b from-indigo-900 via-purple-700 via-fuchsia-500 to-amber-200 opacity-80">
              <div className="absolute inset-0">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute left-0 right-0 border-t border-white/5" style={{ top: `${pct}%` }} />
                ))}
              </div>
              <div className="absolute inset-0">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${pct}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
            </div>

            {/* Annotation box 1 - User annotation (solid cyan) */}
            <div
              className="absolute border-2 border-cyan-400 rounded-sm z-20"
              style={{ left: "calc(12px + 15%)", top: "25%", width: "20%", height: "20%" }}
            >
              <div className="absolute -top-5 left-0 bg-cyan-400/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                ID:01
              </div>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-sm" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-sm" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-sm" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-sm" />
            </div>

            {/* Annotation box 2 - AI suggestion (dashed orange) */}
            <div
              className="absolute border-2 border-dashed border-orange-400 rounded-sm z-20"
              style={{ left: "calc(12px + 50%)", top: "60%", width: "22%", height: "18%" }}
            >
              <div className="absolute -top-5 left-0 bg-orange-400/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI?
              </div>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-sm" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-sm" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-sm" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-400 rounded-sm" />
            </div>

            {/* Playback cursor line */}
            <div className="absolute top-0 bottom-0 w-px bg-white/60 z-30" style={{ left: "calc(12px + 38%)" }}>
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
            </div>

            {/* Hotkey hint overlay */}
            <div className="absolute bottom-3 right-3 z-30 flex gap-1.5">
              {[
                { key: "O", label: "Confirm" },
                { key: "X", label: "Reject" },
                { key: "B", label: "Brush" },
                { key: "R", label: "Box" },
                { key: "⌘Z", label: "Undo" },
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
          </div>

          {/* Audio Player Controls */}
          <div className="h-14 shrink-0 bg-panel border-t border-border flex items-center px-4 gap-4">
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="p-2.5 rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-text-secondary tabular-nums">
              <span className="text-text font-medium">03:12.045</span>
              <span className="mx-1 text-text-muted">/</span>
              <span>08:22.000</span>
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
        </main>

        {/* ========================================================== */}
        {/*  RIGHT PANEL - AI Analysis & Properties                    */}
        {/* ========================================================== */}
        <aside className="w-[320px] shrink-0 bg-panel border-l border-border flex flex-col overflow-y-auto">
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
