/** Header panel for labeling workspace with mode and score summary. */
import { AudioLines } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LabelingMode } from "@/types";

type LabelingHeaderProps = {
  mode: LabelingMode;
  score: number;
  streak: number;
  sessionError: string | null;
  suggestionError: string | null;
};

export default function LabelingHeader({
  mode,
  score,
  streak,
  sessionError,
  suggestionError,
}: LabelingHeaderProps) {
  const t = useTranslations("labeling");

  return (
    <>
      <header className="h-14 shrink-0 bg-panel border-b border-border flex items-center justify-between px-3 md:px-5 overflow-x-auto">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text tracking-tight hidden sm:inline">{t("brandName")}</span>
          </div>

          <div className="h-5 w-px bg-border-light hidden md:block" />

          <span className="text-xs text-text-secondary hidden md:inline">
            {t("project")} <span className="text-text font-medium">{t("projectName")}</span>
          </span>

          <span className="text-[10px] font-bold bg-primary/20 text-primary-light px-2 py-0.5 rounded-full hidden lg:inline">
            {t("version")}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-5 shrink-0">
          <div
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
              mode === "review" ? "bg-accent/15 text-accent" : "bg-warning/15 text-warning"
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
            <span className="text-text tabular-nums">
              {streak} {t("streakUnit")}
            </span>
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
    </>
  );
}
