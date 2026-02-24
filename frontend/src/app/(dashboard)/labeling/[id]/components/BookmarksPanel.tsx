/** Bookmark panel for quick review notes tied to timeline positions. */
import type { BookmarkType, LabelingBookmark } from "@/types";

type BookmarkPreset = {
  type: BookmarkType;
  label: string;
  note: string;
};

type BookmarksPanelProps = {
  bookmarks: LabelingBookmark[];
  presets: BookmarkPreset[];
  onAdd: (preset: BookmarkPreset) => void;
  onSeek: (time: number) => void;
  onRemove: (id: string) => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export default function BookmarksPanel({
  bookmarks,
  presets,
  onAdd,
  onSeek,
  onRemove,
}: BookmarksPanelProps) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
        Bookmarks
      </h3>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {presets.map((preset) => (
          <button
            key={preset.type}
            onClick={() => onAdd(preset)}
            className="px-2 py-1 rounded-md text-[10px] bg-surface text-text-secondary hover:bg-panel-light transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {bookmarks.length === 0 ? (
        <p className="text-[11px] text-text-muted">No bookmarks yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {bookmarks.map((item) => (
            <div key={item.id} className="rounded-md bg-surface px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onSeek(item.time)}
                  className="text-[11px] text-text-secondary hover:text-text text-left transition-colors"
                >
                  {formatTime(item.time)} - {item.note}
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-[10px] text-danger/80 hover:text-danger transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
