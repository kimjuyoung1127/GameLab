/** Bookmark panel: preset quick-add, inline note editing, color-coded list with seek. */
"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BookmarkType, LabelingBookmark } from "@/types";
import { bookmarkColors } from "./constants";

type BookmarkPreset = {
  type: BookmarkType;
  label: string;
  note: string;
};

type BookmarksPanelProps = {
  bookmarks: LabelingBookmark[];
  presets: BookmarkPreset[];
  onAdd: (preset: BookmarkPreset) => void;
  onSeek: (time: number, bookmarkId: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: { note?: string; type?: BookmarkType }) => void;
  highlightedId: string | null;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

const typeLabels: Record<BookmarkType, string> = {
  recheck: "Recheck",
  noise_suspect: "Noise",
  edge_case: "Edge",
  needs_analysis: "Analysis",
};

export default function BookmarksPanel({
  bookmarks,
  presets,
  onAdd,
  onSeek,
  onRemove,
  onUpdate,
  highlightedId,
}: BookmarksPanelProps) {
  const t = useTranslations("labeling");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleNoteBlur = useCallback(
    (id: string, newNote: string) => {
      onUpdate(id, { note: newNote });
    },
    [onUpdate],
  );

  const handleNoteKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onUpdate(id, { note: e.currentTarget.value });
        setExpandedId(null);
      }
      if (e.key === "Escape") {
        setExpandedId(null);
      }
    },
    [onUpdate],
  );

  return (
    <div className="px-4 py-3 border-b border-border">
      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
        {t("bookmarkAdd").replace(/추가|Add/i, "").trim() || "Bookmarks"}
        {bookmarks.length > 0 && (
          <span className="ml-1.5 text-text-secondary font-normal normal-case">
            ({bookmarks.length})
          </span>
        )}
      </h3>

      {/* Preset quick-add buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {presets.map((preset) => (
          <button
            key={preset.type}
            onClick={() => onAdd(preset)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-surface text-text-secondary hover:bg-panel-light transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${bookmarkColors[preset.type].dot}`} />
            {preset.label}
          </button>
        ))}
      </div>

      {/* Bookmark list */}
      {bookmarks.length === 0 ? (
        <p className="text-[11px] text-text-muted">{t("bookmarkNoBookmarks") ?? "No bookmarks yet."}</p>
      ) : (
        <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
          {bookmarks.map((item) => {
            const colors = bookmarkColors[item.type];
            const isExpanded = expandedId === item.id;
            const isHighlighted = highlightedId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-md bg-surface transition-all duration-300 ${
                  isHighlighted ? "ring-1 ring-primary/60 bg-primary/10" : ""
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />

                  <button
                    onClick={() => onSeek(item.time, item.id)}
                    title={t("bookmarkJumpTo") ?? "Jump to position"}
                    className="text-[10px] font-mono text-primary-light hover:text-primary transition-colors shrink-0"
                  >
                    {formatTime(item.time)}
                  </button>

                  <span className="text-[10px] text-text-muted truncate flex-1">
                    {item.note || typeLabels[item.type]}
                  </span>

                  <button
                    onClick={() => handleToggleExpand(item.id)}
                    title={t("bookmarkEditPlaceholder") ?? "Edit note"}
                    className="p-0.5 text-text-muted hover:text-text-secondary transition-colors shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <Pencil className="w-3 h-3" />
                    )}
                  </button>

                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-0.5 text-danger/60 hover:text-danger transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Expanded note editor */}
                {isExpanded && (
                  <div className="px-2 pb-2">
                    <textarea
                      ref={textareaRef}
                      defaultValue={item.note}
                      placeholder={t("bookmarkEditPlaceholder") ?? "Type a note..."}
                      onBlur={(e) => handleNoteBlur(item.id, e.target.value)}
                      onKeyDown={(e) => handleNoteKeyDown(e, item.id)}
                      autoFocus
                      rows={2}
                      className="w-full bg-panel border border-border-light rounded-md px-2 py-1.5 text-[10px] text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-text-muted"
                    />
                    <p className="text-[8px] text-text-muted mt-0.5">
                      Enter to save · Shift+Enter for new line · Esc to cancel
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
