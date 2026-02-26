/** Center spectrogram workspace with waveform, overlays, suggestion boxes, and draft interaction. */
"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, Flag, Sparkles, Wrench, X } from "lucide-react";
import { useTranslations } from "next-intl";
import WaveformCanvas from "@/components/domain/labeling/WaveformCanvas";
import SpectrogramCanvas from "@/components/domain/labeling/SpectrogramCanvas";
import type { AudioPlayerState } from "@/lib/hooks/use-audio-player";
import type {
  BookmarkType,
  DrawTool,
  LabelingBookmark,
  LoopState,
  ManualDraft,
  Suggestion,
  SuggestionStatus,
  SpectrogramData,
  WaveformData,
} from "@/types";
import { bookmarkColors } from "./constants";

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type SpectrogramPanelProps = {
  waveformData: WaveformData | null;
  spectrogramData: SpectrogramData | null;
  spectrogramLoading: boolean;
  player: AudioPlayerState;
  totalDuration: number;
  zoomLevel: number;
  fileCompleteToast: boolean;
  isLastFile: boolean;
  onDismissCompleteToast: () => void;
  effectiveMaxFreq: number;
  spectrogramRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  tool: DrawTool;
  zoomBoxMode: boolean;
  suggestions: Suggestion[];
  manualDrafts: ManualDraft[];
  selectedSuggestionId: string | null;
  selectedDraftId: string | null;
  onSelectSuggestion: (id: string) => void;
  onSelectDraft: (id: string) => void;
  onDraftPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDraftPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDraftPointerUp: (e?: React.PointerEvent<HTMLDivElement>) => void;
  onSuggestionDragPointerDown: (e: React.PointerEvent<HTMLButtonElement>, suggestion: Suggestion) => void;
  onSuggestionDragPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onSuggestionDragPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onSuggestionResizePointerDown: (e: React.PointerEvent<HTMLDivElement>, suggestion: Suggestion, handle: ResizeHandle) => void;
  onSuggestionResizePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onSuggestionResizePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDraftDragPointerDown: (e: React.PointerEvent<HTMLButtonElement>, draft: ManualDraft) => void;
  onDraftDragPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onDraftDragPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onDraftResizePointerDown: (e: React.PointerEvent<HTMLDivElement>, draft: ManualDraft, handle: ResizeHandle) => void;
  onDraftResizePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDraftResizePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  suggestionBoxStyle: (s: Suggestion | ManualDraft, totalDuration: number, freqMin: number, freqMax: number) => {
    left: string;
    width: string;
    top: string;
    height: string;
  };
  freqMin: number;
  freqMax: number;
  onFreqRangeChange: (min: number, max: number) => void;
  statusColors: Record<SuggestionStatus, { border: string; bg: string; tagBg: string; label: string; dashed: boolean }>;
  draftPreview: ManualDraft | null;
  playbackPct: number;
  formatTimecode: (value: number) => string;
  loopState: LoopState;
  bookmarks: LabelingBookmark[];
  loopRangeLabel: string;
  fitToSuggestion: boolean;
  showFitToast: boolean;
  loopHudWarning: boolean;
  activeSuggestion: Suggestion | null;
  onConfirm: () => void;
  onReject: () => void;
  audioLoadError: string | null;
  onRetryAudio: () => void;
  onSeek: (time: number, trackHistory?: boolean) => void;
  highlightedBookmarkId: string | null;
};

export default function SpectrogramPanel({
  waveformData,
  spectrogramData,
  spectrogramLoading,
  player,
  totalDuration,
  zoomLevel,
  fileCompleteToast,
  isLastFile,
  onDismissCompleteToast,
  effectiveMaxFreq,
  spectrogramRef,
  scrollContainerRef,
  tool,
  zoomBoxMode,
  suggestions,
  manualDrafts,
  selectedSuggestionId,
  selectedDraftId,
  onSelectSuggestion,
  onSelectDraft,
  onDraftPointerDown,
  onDraftPointerMove,
  onDraftPointerUp,
  onSuggestionDragPointerDown,
  onSuggestionDragPointerMove,
  onSuggestionDragPointerUp,
  onSuggestionResizePointerDown,
  onSuggestionResizePointerMove,
  onSuggestionResizePointerUp,
  onDraftDragPointerDown,
  onDraftDragPointerMove,
  onDraftDragPointerUp,
  onDraftResizePointerDown,
  onDraftResizePointerMove,
  onDraftResizePointerUp,
  suggestionBoxStyle,
  statusColors,
  draftPreview,
  playbackPct,
  formatTimecode,
  loopState,
  bookmarks,
  loopRangeLabel,
  fitToSuggestion,
  showFitToast,
  loopHudWarning,
  activeSuggestion,
  onConfirm,
  onReject,
  audioLoadError,
  onRetryAudio,
  onSeek,
  highlightedBookmarkId,
  freqMin,
  freqMax,
  onFreqRangeChange,
}: SpectrogramPanelProps) {
  const t = useTranslations("labeling");

  /* Post-it note bubble state */
  const [hoveredBookmarkId, setHoveredBookmarkId] = useState<string | null>(null);
  const [pinnedBookmarkId, setPinnedBookmarkId] = useState<string | null>(null);

  const handleBookmarkClick = useCallback((e: React.MouseEvent, bId: string) => {
    e.stopPropagation();
    setPinnedBookmarkId((prev) => (prev === bId ? null : bId));
  }, []);

  /* Close pinned bubble on Escape */
  useEffect(() => {
    if (!pinnedBookmarkId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinnedBookmarkId(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [pinnedBookmarkId]);

  const bookmarkTypeLabel: Record<BookmarkType, string> = {
    recheck: t("bookmarkRecheck"),
    noise_suspect: t("bookmarkNoise"),
    edge_case: t("bookmarkEdge"),
    needs_analysis: t("bookmarkNeedsAnalysis"),
  };

  return (
    <>
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div className="h-20 shrink-0 bg-surface/50 border-b border-border/30 relative">
          {waveformData ? (
            <WaveformCanvas
              peaks={waveformData.peaks}
              currentTime={player.currentTime}
              duration={totalDuration}
              onSeek={player.canPlay ? (time) => onSeek(time, false) : () => {}}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[11px] text-text-muted">{t("waveformLoading")}</div>
          )}
        </div>

        {audioLoadError && (
          <div className="mx-3 mt-3 shrink-0 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger flex items-center justify-between gap-3">
            <span>{audioLoadError}</span>
            <button onClick={onRetryAudio} className="px-2 py-1 rounded bg-danger/20 hover:bg-danger/30 transition-colors">
              Retry
            </button>
          </div>
        )}

        <div ref={scrollContainerRef} className="flex-1 relative overflow-x-auto overflow-y-hidden">
          <div
            className="relative h-full min-w-full"
            style={{ width: `${Math.max(zoomLevel, 1) * 100}%` }}
          >

            <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between py-4 z-10">
              {(() => {
                const range = freqMax - freqMin;
                const steps = [freqMax, freqMin + range * 0.75, freqMin + range * 0.5, freqMin + range * 0.25, freqMin];
                return steps.map((freq, i) => {
                  const label =
                    freq >= 1000 ? `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}kHz` : `${Math.round(freq)}Hz`;
                  return (
                    <span key={i} className="text-[10px] text-text-muted/70 font-mono text-right pr-2 pointer-events-none">
                      {label}
                    </span>
                  );
                });
              })()}
              {/* Frequency range preset buttons */}
              <div className="absolute -left-0.5 bottom-0 translate-y-full pt-1 flex flex-col gap-0.5 pointer-events-auto z-20">
                {([
                  { label: t("freqPresetFull"), min: 0, max: effectiveMaxFreq },
                  { label: t("freqPresetLow"), min: 0, max: 5000 },
                  { label: t("freqPresetMid"), min: 1000, max: 8000 },
                  { label: t("freqPresetHigh"), min: 5000, max: effectiveMaxFreq },
                ] as const).map((preset) => {
                  const active = freqMin === preset.min && freqMax === preset.max;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => onFreqRangeChange(preset.min, Math.min(preset.max, effectiveMaxFreq))}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-colors ${
                        active
                          ? "bg-primary/30 text-primary-light"
                          : "bg-surface/80 text-text-muted hover:bg-panel-light hover:text-text-secondary"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              ref={spectrogramRef}
              onPointerDown={onDraftPointerDown}
              onPointerMove={onDraftPointerMove}
              onPointerUp={onDraftPointerUp}
              onPointerLeave={onDraftPointerUp}
              className={`absolute top-0 left-12 right-0 bottom-6 bg-black ${tool === "box" || zoomBoxMode ? "cursor-crosshair" : "cursor-pointer"}`}
            >
              <SpectrogramCanvas data={spectrogramData} loading={spectrogramLoading} className="absolute inset-0" />
              <div className="absolute inset-0 pointer-events-none">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute left-0 right-0 border-t border-white/10" style={{ top: `${pct}%` }} />
                ))}
              </div>
              <div className="absolute inset-0 pointer-events-none">
                {[20, 40, 60, 80].map((pct) => (
                  <div key={pct} className="absolute top-0 bottom-0 border-l border-white/10" style={{ left: `${pct}%` }} />
                ))}
              </div>
            </div>

            {suggestions.map((s) => {
              const sc = statusColors[s.status];
              const isSelected = s.id === selectedSuggestionId;
              const isEditable = s.source === "user";
              const boxPos = suggestionBoxStyle(s, totalDuration, freqMin, freqMax);
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSuggestion(s.id)}
                  onPointerDown={isEditable ? (e) => onSuggestionDragPointerDown(e, s) : undefined}
                  onPointerMove={isEditable ? onSuggestionDragPointerMove : undefined}
                  onPointerUp={isEditable ? onSuggestionDragPointerUp : undefined}
                  onPointerCancel={isEditable ? onSuggestionDragPointerUp : undefined}
                  className={`absolute border-2 rounded-sm z-20 transition-all duration-200 ${sc.border} ${sc.dashed ? "border-dashed" : ""} ${isEditable ? "cursor-move" : ""} ${
                    isSelected ? "ring-2 ring-white/30 shadow-lg shadow-white/10" : "hover:ring-1 hover:ring-white/20"
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
                  <div className={`absolute -top-5 left-0 ${sc.tagBg} text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 whitespace-nowrap`}>
                    {s.status === "pending" && <Sparkles className="w-2.5 h-2.5" />}
                    {s.status === "confirmed" && <Check className="w-2.5 h-2.5" />}
                    {s.status === "rejected" && <X className="w-2.5 h-2.5" />}
                    {s.status === "corrected" && <Wrench className="w-2.5 h-2.5" />}
                    <span title={s.label}>{s.label.slice(0, 18)}</span>
                    {isEditable && <span className="text-[7px] opacity-70">{t("userSuggestionTag")}</span>}
                  </div>
                  {isSelected && !isEditable && (
                    <>
                      <div className={`absolute -top-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -top-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                      <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${sc.bg} rounded-sm`} />
                    </>
                  )}
                  {isSelected && isEditable && tool === "select" && (
                    <>
                      <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm ${sc.bg} border border-white/40 cursor-nwse-resize`} onPointerDown={(e) => onSuggestionResizePointerDown(e, s, "nw")} onPointerMove={onSuggestionResizePointerMove} onPointerUp={onSuggestionResizePointerUp} onPointerCancel={onSuggestionResizePointerUp} />
                      <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm ${sc.bg} border border-white/40 cursor-nesw-resize`} onPointerDown={(e) => onSuggestionResizePointerDown(e, s, "ne")} onPointerMove={onSuggestionResizePointerMove} onPointerUp={onSuggestionResizePointerUp} onPointerCancel={onSuggestionResizePointerUp} />
                      <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm ${sc.bg} border border-white/40 cursor-nesw-resize`} onPointerDown={(e) => onSuggestionResizePointerDown(e, s, "sw")} onPointerMove={onSuggestionResizePointerMove} onPointerUp={onSuggestionResizePointerUp} onPointerCancel={onSuggestionResizePointerUp} />
                      <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm ${sc.bg} border border-white/40 cursor-nwse-resize`} onPointerDown={(e) => onSuggestionResizePointerDown(e, s, "se")} onPointerMove={onSuggestionResizePointerMove} onPointerUp={onSuggestionResizePointerUp} onPointerCancel={onSuggestionResizePointerUp} />
                    </>
                  )}
                  <span className="absolute -bottom-5 left-0 text-[9px] font-mono font-bold tabular-nums" style={{ color: "inherit" }}>
                    <span className={sc.label}>{s.confidence}%</span>
                  </span>
                </button>
              );
            })}

            {manualDrafts.map((draft) => {
              const pos = suggestionBoxStyle(draft, totalDuration, freqMin, freqMax);
              const isSelected = draft.id === selectedDraftId;
              return (
                <button
                  key={draft.id}
                  onClick={() => onSelectDraft(draft.id)}
                  onPointerDown={(e) => onDraftDragPointerDown(e, draft)}
                  onPointerMove={onDraftDragPointerMove}
                  onPointerUp={onDraftDragPointerUp}
                  onPointerCancel={onDraftDragPointerUp}
                  className={`absolute border-2 rounded-sm z-20 transition-all ${
                    isSelected ? "border-cyan-300 bg-cyan-300/10 ring-2 ring-cyan-100/50" : "border-cyan-400/80 bg-cyan-400/10 hover:border-cyan-300"
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
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nwse-resize" onPointerDown={(e) => onDraftResizePointerDown(e, draft, "nw")} onPointerMove={onDraftResizePointerMove} onPointerUp={onDraftResizePointerUp} onPointerCancel={onDraftResizePointerUp} />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nesw-resize" onPointerDown={(e) => onDraftResizePointerDown(e, draft, "ne")} onPointerMove={onDraftResizePointerMove} onPointerUp={onDraftResizePointerUp} onPointerCancel={onDraftResizePointerUp} />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nesw-resize" onPointerDown={(e) => onDraftResizePointerDown(e, draft, "sw")} onPointerMove={onDraftResizePointerMove} onPointerUp={onDraftResizePointerUp} onPointerCancel={onDraftResizePointerUp} />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-200 border border-cyan-50 cursor-nwse-resize" onPointerDown={(e) => onDraftResizePointerDown(e, draft, "se")} onPointerMove={onDraftResizePointerMove} onPointerUp={onDraftResizePointerUp} onPointerCancel={onDraftResizePointerUp} />
                    </>
                  )}
                </button>
              );
            })}

            {draftPreview && (() => {
              const pos = suggestionBoxStyle(draftPreview, totalDuration, freqMin, freqMax);
              return (
                <div
                  className={`absolute border-2 rounded-sm z-20 pointer-events-none ${
                    zoomBoxMode ? "border-amber-200 bg-amber-300/15" : "border-cyan-200 bg-cyan-300/15"
                  }`}
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

            <div className="absolute top-0 bottom-6 w-px bg-white/60 z-30" style={{ left: `calc(48px + ${playbackPct}%)` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-white/90 font-mono whitespace-nowrap">
                {formatTimecode(player.currentTime)}
              </div>
            </div>

            {loopState.start !== null && (
              <div className="absolute top-0 bottom-6 w-px bg-warning/80 z-30" style={{ left: `calc(48px + ${(loopState.start / totalDuration) * 100}%)` }} />
            )}
            {loopState.end !== null && (
              <div className="absolute top-0 bottom-6 w-px bg-warning/80 z-30" style={{ left: `calc(48px + ${(loopState.end / totalDuration) * 100}%)` }} />
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

            {bookmarks.map((b) => {
              const colors = bookmarkColors[b.type];
              const isHighlighted = highlightedBookmarkId === b.id;
              const showBubble = hoveredBookmarkId === b.id || pinnedBookmarkId === b.id;
              const leftPct = (b.time / totalDuration) * 100;

              return (
                <div
                  key={`bm-${b.id}`}
                  className={`absolute top-0 bottom-6 w-0.5 ${colors.line} z-25`}
                  style={{ left: `calc(48px + ${leftPct}%)` }}
                  onMouseEnter={() => setHoveredBookmarkId(b.id)}
                  onMouseLeave={() => setHoveredBookmarkId(null)}
                  onClick={(e) => handleBookmarkClick(e, b.id)}
                >
                  <Flag
                    className={`absolute -top-0.5 -left-1.5 w-3 h-3 ${colors.flag} cursor-pointer transition-transform duration-300 ${
                      isHighlighted ? "scale-150 drop-shadow-[0_0_4px_currentColor]" : ""
                    }`}
                  />
                  {/* Post-it note bubble */}
                  {showBubble && (
                    <div
                      className={`absolute top-5 z-35 border rounded-lg shadow-lg px-2.5 py-2 max-w-[200px] min-w-[120px] text-[10px] ${colors.postIt}`}
                      style={{ left: "50%", transform: "translateX(-50%)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`font-bold mb-0.5 ${colors.flag}`}>
                        {bookmarkTypeLabel[b.type]}
                      </div>
                      <div className="whitespace-pre-wrap break-words text-text-secondary leading-relaxed">
                        {b.note || bookmarkTypeLabel[b.type]}
                      </div>
                      <div className="text-[8px] text-text-muted mt-1 font-mono">
                        {formatTimecode(b.time)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

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

          </div>

          {fileCompleteToast && (
            <div
              onClick={onDismissCompleteToast}
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

          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="absolute top-2 right-3 flex gap-2">
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

            <div className="absolute top-8 right-3 rounded-lg border border-white/10 bg-black/45 backdrop-blur-sm px-2.5 py-2 text-[10px] space-y-1 min-w-[180px]">
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
                <span className="text-cyan-200 font-mono">{selectedDraftId ? t("stateHudSelectedDraft") : t("stateHudAllDrafts")}</span>
              </div>
              {loopHudWarning && <p className="text-danger text-[9px]">{t("loopRequireBounds")}</p>}
            </div>

            <div className="absolute bottom-8 left-3 bg-black/55 text-[9px] text-text-muted px-2 py-1 rounded font-mono">
              {zoomBoxMode ? t("zoomBoxHint") : t("clickDragSeekHint")}
            </div>
            {showFitToast && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-accent/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded">
                {t("autoFitApplied")}
              </div>
            )}

            <div className="absolute bottom-8 right-3 flex gap-1.5">
              {[
                { key: "O", labelKey: "hintConfirm" },
                { key: "X", labelKey: "hintReject" },
                { key: "R", labelKey: "hintBox" },
                { key: "Ctrl+Z", labelKey: "hintUndo" },
                { key: "Ctrl+Shift+Z", labelKey: "hintRedo" },
                { key: "Ctrl+Enter", labelKey: "hintManualSave" },
                { key: "I/P/L", labelKey: "hintLoop" },
                { key: "M", labelKey: "hintMark" },
                { key: "Ctrl+Shift+\u2190/\u2192", labelKey: "hintBookmarkNav" },
              ].map((hint) => (
                <div key={hint.key} className="bg-black/60 backdrop-blur-sm text-[9px] text-text-muted px-1.5 py-0.5 rounded font-mono">
                  <span className="text-text-secondary font-bold">{hint.key}</span> {t(hint.labelKey)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            onClick={onConfirm}
            disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" /> {t("okButton")}
          </button>
          <button
            onClick={onReject}
            disabled={!activeSuggestion || activeSuggestion.status !== "pending"}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5" /> {t("ngButton")}
          </button>
        </div>
      </div>
    </>
  );
}
