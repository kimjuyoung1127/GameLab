/** Left panel showing file search/filter/list and daily goal progress. */
import { FileAudio, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AudioFile } from "@/types";
import ProgressBadge from "./ProgressBadge";

type FileListPanelProps = {
  fileFilter: string;
  onFileFilterChange: (value: string) => void;
  filterTab: "all" | "pending" | "done";
  onFilterTabChange: (tab: "all" | "pending" | "done") => void;
  filteredFiles: AudioFile[];
  activeFileId: string | null;
  onFileClick: (file: AudioFile) => void;
  fileProgressMap: Record<string, { total: number; reviewed: number }>;
  dailyGoal: number;
  dailyProgress: number;
};

export default function FileListPanel({
  fileFilter,
  onFileFilterChange,
  filterTab,
  onFilterTabChange,
  filteredFiles,
  activeFileId,
  onFileClick,
  fileProgressMap,
  dailyGoal,
  dailyProgress,
}: FileListPanelProps) {
  const t = useTranslations("labeling");

  return (
    <aside className="hidden md:flex w-[280px] shrink-0 bg-panel border-r border-border flex-col">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={t("filterPlaceholder")}
            value={fileFilter}
            onChange={(e) => onFileFilterChange(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex px-3 gap-1 mb-1">
        {(["all", "pending", "done"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onFilterTabChange(tab)}
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

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <button
              key={file.id}
              onClick={() => onFileClick(file)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors relative group ${
                isActive
                  ? "bg-surface border-l-2 border-l-warning"
                  : "hover:bg-panel-light border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <FileAudio className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-xs font-medium text-text truncate">{file.filename}</span>
                </div>
                <ProgressBadge status={file.status} />
              </div>
              <div className="flex items-center gap-3 pl-5.5">
                <span className="text-[10px] text-text-muted tabular-nums">{file.duration}</span>
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
            style={{ width: `${Math.min((dailyProgress / Math.max(dailyGoal, 1)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
