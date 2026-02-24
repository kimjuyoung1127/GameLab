/** Compact action history panel for recent labeling interactions. */
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ActionHistoryItem } from "@/types";

type ActionHistoryPanelProps = {
  items: ActionHistoryItem[];
  onClear: () => void;
  onReplay: (item: ActionHistoryItem) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  undoHint: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function typeLabel(type: ActionHistoryItem["type"]): string {
  if (type === "ai_confirm") return "AI";
  if (type === "manual_create") return "MANUAL+";
  if (type === "manual_delete") return "MANUAL-";
  if (type === "manual_move") return "MOVE";
  if (type === "manual_resize") return "RESIZE";
  if (type === "loop_set") return "LOOP";
  if (type === "undo") return "UNDO";
  if (type === "redo") return "REDO";
  return type.toUpperCase();
}

export default function ActionHistoryPanel({
  items,
  onClear,
  onReplay,
  collapsed,
  onToggleCollapsed,
  undoHint,
}: ActionHistoryPanelProps) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onToggleCollapsed}
          className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Recent Actions
        </button>
        {!collapsed && (
          <button
            onClick={onClear}
            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-[10px] text-text-muted mb-2">{undoHint}</p>
      {collapsed ? null : items.length === 0 ? (
        <p className="text-[11px] text-text-muted">No actions yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onReplay(item)}
              className="w-full text-left rounded-md bg-surface px-2 py-1.5 hover:bg-panel-light transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-text-secondary truncate">
                  <span className="inline-block mr-1 rounded bg-panel px-1 py-0.5 text-[9px] text-text-muted">
                    {typeLabel(item.type)}
                  </span>
                  {item.summary}
                </span>
                <span className="text-[10px] text-text-muted font-mono shrink-0">
                  {formatTime(item.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
