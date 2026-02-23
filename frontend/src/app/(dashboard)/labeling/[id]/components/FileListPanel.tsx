/** Left panel: file filter, list, and daily progress summary. */
import { FileAudio, Search } from "lucide-react";
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
  pendingCount: number;
  confirmedCount: number;
  totalCount: number;
  styles: Record<string, string>;
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
  pendingCount,
  confirmedCount,
  totalCount,
  styles,
}: FileListPanelProps) {
  const reviewedCount = confirmedCount + (totalCount - pendingCount - confirmedCount);
  const dailyGoalPct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  return (
    <aside className={styles.c022}>
      <div className={styles.c023}>
        <div className={styles.c024}>
          <Search className={styles.c025} />
          <input
            type="text"
            placeholder="Filter files..."
            value={fileFilter}
            onChange={(e) => onFileFilterChange(e.target.value)}
            className={styles.c026}
          />
        </div>
      </div>

      <div className={styles.c027}>
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
            {tab === "all" ? "All" : tab === "pending" ? "Pending" : "Done"}
          </button>
        ))}
      </div>

      <div className={styles.c028}>
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
              <div className={styles.c029}>
                <div className={styles.c030}>
                  <FileAudio className={styles.c031} />
                  <span className={styles.c032}>{file.filename}</span>
                </div>
                <ProgressBadge status={file.status} />
              </div>
              <div className={styles.c033}>
                <span className={styles.c034}>{file.duration}</span>
                <span className={styles.c035}>{file.sampleRate}</span>
                {fileProgressMap[file.id] && (
                  <span className={styles.c035}>
                    {fileProgressMap[file.id].reviewed}/{fileProgressMap[file.id].total}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {filteredFiles.length === 0 && (
          <div className={styles.c036}>
            <p className={styles.c037}>No files found for this session.</p>
          </div>
        )}
      </div>

      <div className={styles.c038}>
        <div className={styles.c039}>
          <span className={styles.c040}>Daily Goal</span>
          <span className={styles.c041}>{dailyGoalPct}%</span>
        </div>
        <div className={styles.c042}>
          <div className={styles.c043} style={{ width: `${dailyGoalPct}%` }} />
        </div>
      </div>
    </aside>
  );
}
