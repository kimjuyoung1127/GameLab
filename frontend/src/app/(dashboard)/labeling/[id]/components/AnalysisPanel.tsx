/** Right-side analysis panel with cards, metadata, bookmarks/history and next action. */
import { Check, ChevronRight, Copy, Filter, Sparkles, Wrench, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AudioFile, LabelingMode, Suggestion, SuggestionStatus } from "@/types";
import { getLabelDisplay } from "@/lib/labeling/label-display";
import { useUIStore } from "@/lib/store/ui-store";

type AnalysisPanelProps = {
  mode: LabelingMode;
  activeSuggestion: Suggestion | null;
  rejectedSuggestion: Suggestion | null;
  pendingCount: number;
  confirmedCount: number;
  totalCount: number;
  activeFile: AudioFile | undefined;
  onConfirm: () => void;
  onReject: () => void;
  onApplyFix: () => void;
  onNextFile: () => void;
  statusFilter: SuggestionStatus | "all";
  onStatusFilterChange: (filter: SuggestionStatus | "all") => void;
  children?: React.ReactNode;
};

export default function AnalysisPanel({
  mode,
  activeSuggestion,
  rejectedSuggestion,
  pendingCount,
  confirmedCount,
  totalCount,
  activeFile,
  onConfirm,
  onReject,
  onApplyFix,
  onNextFile,
  statusFilter,
  onStatusFilterChange,
  children,
}: AnalysisPanelProps) {
  const t = useTranslations("labeling");
  const activeLabelDisplay = activeSuggestion
    ? getLabelDisplay(activeSuggestion.label, activeSuggestion.description)
    : null;

  const confidenceColor = activeSuggestion
    ? activeSuggestion.confidence >= 80 ? "bg-accent" : activeSuggestion.confidence >= 50 ? "bg-warning" : "bg-danger"
    : "bg-primary";
  const confidenceTextColor = activeSuggestion
    ? activeSuggestion.confidence >= 80 ? "text-accent" : activeSuggestion.confidence >= 50 ? "text-warning" : "text-danger"
    : "text-primary-light";
  const rejectedLabelDisplay = rejectedSuggestion
    ? getLabelDisplay(rejectedSuggestion.label, rejectedSuggestion.description)
    : null;

  const handleCopy = async () => {
    if (!activeSuggestion || !activeLabelDisplay) return;
    const text = [
      `[${activeLabelDisplay.displayCode}] ${activeLabelDisplay.displayName} — ${activeSuggestion.confidence}%`,
      `Time: ${activeSuggestion.startTime.toFixed(3)}s – ${activeSuggestion.endTime.toFixed(3)}s`,
      `Freq: ${activeSuggestion.freqLow.toFixed(0)} Hz – ${activeSuggestion.freqHigh.toFixed(0)} Hz`,
      `Description: ${activeSuggestion.description}`,
      `Status: ${activeSuggestion.status}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      useUIStore.getState().showToast(t("copySuccess"));
    } catch { /* clipboard not available */ }
  };

  return (
    <aside className="hidden md:flex w-[320px] shrink-0 bg-panel border-l border-border flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary-light" />
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">{t("aiAnalysis")}</h2>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${statusFilter === "all" ? "bg-primary/30 text-primary-light ring-1 ring-primary/50" : "bg-panel-light text-text-muted hover:text-text-secondary"}`}
          >
            {t("filterAll")}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => onStatusFilterChange("pending")}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${statusFilter === "pending" ? "bg-orange-400/30 text-orange-400 ring-1 ring-orange-400/50" : "bg-orange-400/20 text-orange-400 hover:bg-orange-400/30"}`}
            >
              {t("pendingCount", { count: pendingCount })}
            </button>
          )}
          {confirmedCount > 0 && (
            <button
              onClick={() => onStatusFilterChange("confirmed")}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${statusFilter === "confirmed" ? "bg-accent/30 text-accent ring-1 ring-accent/50" : "bg-accent/20 text-accent hover:bg-accent/30"}`}
            >
              {t("confirmedCount", { count: confirmedCount })}
            </button>
          )}
          {totalCount - pendingCount - confirmedCount > 0 && (
            <button
              onClick={() => onStatusFilterChange("corrected")}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${statusFilter === "corrected" ? "bg-danger/30 text-danger ring-1 ring-danger/50" : "bg-danger/20 text-danger hover:bg-danger/30"}`}
            >
              {t("fixedCount", { count: totalCount - pendingCount - confirmedCount })}
            </button>
          )}
        </div>
      </div>

      {mode === "review" && activeSuggestion && (
        <div className="p-4 border-b border-border">
          <div className="bg-surface rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-text">{activeLabelDisplay?.displayName ?? activeSuggestion.label}</h3>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">{activeLabelDisplay?.displayCode ?? "AI-LABEL"}</p>
                <p className="text-[10px] text-text-muted/80 mt-0.5">raw: {activeSuggestion.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{t("aiDetectedAnomaly")}</p>
                <p className="text-[10px] text-text-muted mt-1">{t("aiActionGuide")}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-2xl font-black tabular-nums ${confidenceTextColor}`}>
                  {t("confidence", { confidence: activeSuggestion.confidence })}
                </span>
                <button
                  onClick={handleCopy}
                  title={t("copySuggestion")}
                  className="p-1 rounded text-text-muted hover:text-text-secondary hover:bg-panel-light transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="h-1.5 bg-panel rounded-full overflow-hidden mb-3">
              <div className={`h-full ${confidenceColor} rounded-full transition-all duration-500`} style={{ width: `${activeSuggestion.confidence}%` }} />
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed mb-4">{activeSuggestion.description}</p>

            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-panel-light hover:bg-border text-danger text-xs font-semibold transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {t("rejectButton")}
                <kbd className="text-[9px] text-text-muted ml-1 bg-panel px-1 rounded">X</kbd>
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {t("confirmButton")}
                <kbd className="text-[9px] text-white/60 ml-1 bg-white/10 px-1 rounded">C</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && rejectedSuggestion && (
        <div className="p-4 border-b border-border">
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-bold text-warning">{t("editMode")}</h3>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
              {t("rejectedPrefix")}
              <span className="text-text font-medium">{rejectedLabelDisplay?.displayName ?? rejectedSuggestion.label}</span>
            </p>
            <p className="text-[10px] text-text-muted/80 mb-2">raw: {rejectedSuggestion.label}</p>
            <p className="text-[11px] text-text-muted mb-4">{t("editInstruction")}</p>

            <button
              onClick={onApplyFix}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning hover:bg-warning/90 text-black text-xs font-bold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {t("applyFix")}
              <kbd className="text-[9px] text-black/50 ml-1 bg-black/10 px-1 rounded">Shift+F</kbd>
            </button>
          </div>
        </div>
      )}

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

      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">{t("properties")}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sensorId")}</label>
            <input type="text" value="N/A" readOnly className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">{t("sampleRate")}</label>
            <input
              type="text"
              value={activeFile?.sampleRate || "N/A"}
              readOnly
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text"
            />
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

      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">{t("notes")}</h3>
        <textarea
          placeholder={t("notesPlaceholder")}
          rows={3}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
        />
      </div>

      {children}

      <div className="p-4 mt-auto">
        <button
          onClick={onNextFile}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {t("saveAndNext")}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
