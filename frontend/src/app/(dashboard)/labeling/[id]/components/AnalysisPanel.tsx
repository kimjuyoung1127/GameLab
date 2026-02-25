/** Right-side analysis panel with cards, metadata, bookmarks/history and next action. */
import { Check, ChevronRight, Filter, Sparkles, Wrench, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AudioFile, LabelingMode, Suggestion } from "@/types";

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
  children,
}: AnalysisPanelProps) {
  const t = useTranslations("labeling");

  return (
    <aside className="hidden md:flex w-[320px] shrink-0 bg-panel border-l border-border flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary-light" />
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">{t("aiAnalysis")}</h2>
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
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${activeSuggestion.confidence}%` }} />
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
                <kbd className="text-[9px] text-white/60 ml-1 bg-white/10 px-1 rounded">O</kbd>
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
              {t("rejectedPrefix")}<span className="text-text font-medium">{rejectedSuggestion.label}</span>
            </p>
            <p className="text-[11px] text-text-muted mb-4">{t("editInstruction")}</p>

            <button
              onClick={onApplyFix}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-warning hover:bg-warning/90 text-black text-xs font-bold transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {t("applyFix")}
              <kbd className="text-[9px] text-black/50 ml-1 bg-black/10 px-1 rounded">F</kbd>
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
