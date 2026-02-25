/** Top toolbar with tools, zoom, undo/redo, save, export and file indicator. */
import { FileAudio, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DrawTool } from "@/types";
import { endpoints } from "@/lib/api/endpoints";
import { tools, zoomTools } from "./constants";

type ToolBarProps = {
  tool: DrawTool;
  snapEnabled: boolean;
  fitToSuggestion: boolean;
  onToolChange: (tool: DrawTool) => void;
  onToggleSnap: () => void;
  onToggleFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomLevelChange: (updater: (current: number) => number) => void;
  confirmedCount: number;
  totalCount: number;
  sessionId: string;
  activeFileName?: string;
  onSaveManualDrafts: () => void;
};

export default function ToolBar({
  tool,
  snapEnabled,
  fitToSuggestion,
  onToolChange,
  onToggleSnap,
  onToggleFit,
  onUndo,
  onRedo,
  onZoomLevelChange,
  confirmedCount,
  totalCount,
  sessionId,
  activeFileName,
  onSaveManualDrafts,
}: ToolBarProps) {
  const t = useTranslations("labeling");

  return (
    <div className="h-11 shrink-0 bg-panel border-b border-border flex items-center px-3 gap-1">
      {tools.map((toolItem) => (
        <button
          key={toolItem.id}
          onClick={() => {
            if (toolItem.id === "anchor") {
              onToggleSnap();
              return;
            }
            onToolChange(toolItem.id);
          }}
          title={`${t(toolItem.labelKey)} (${toolItem.hotkey})`}
          className={`p-2 rounded-md transition-colors ${
            toolItem.id === "anchor"
              ? snapEnabled
                ? "bg-warning/20 text-warning"
                : "text-text-secondary hover:bg-panel-light hover:text-text"
              : tool === toolItem.id
              ? "bg-primary text-white"
              : "text-text-secondary hover:bg-panel-light hover:text-text"
          }`}
        >
          <toolItem.icon className="w-4 h-4" />
        </button>
      ))}

      <div className="h-5 w-px bg-border-light mx-1" />

      {zoomTools.map((zt) => (
        <button
          key={zt.id}
          title={t(zt.labelKey)}
          onClick={() =>
            onZoomLevelChange((prev) =>
              zt.id === "zoom-in" ? Math.min(prev + 0.25, 3.0) : Math.max(prev - 0.25, 0.5),
            )
          }
          className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
        >
          <zt.icon className="w-4 h-4" />
        </button>
      ))}

      <button
        onClick={onToggleFit}
        title={t("fitToSuggestion")}
        className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
          fitToSuggestion ? "bg-primary/20 text-primary-light" : "bg-surface text-text-muted hover:text-text-secondary"
        }`}
      >
        {t("fitShort")}
      </button>

      <div className="h-5 w-px bg-border-light mx-1" />

      <button onClick={onUndo} title={t("undoTitle")} className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={onRedo} title={t("redoTitle")} className="p-2 rounded-md text-text-secondary hover:bg-panel-light hover:text-text transition-colors">
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="ml-auto flex items-center gap-3 text-[11px] text-text-muted">
        <span className="text-text-secondary">
          {confirmedCount}/{totalCount} {t("tagged")}
        </span>
        <button
          onClick={onSaveManualDrafts}
          className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-[10px] font-semibold transition-colors"
          title={t("manualSaveTitle")}
        >
          {t("manualSaveButton")}
        </button>
        <a
          href={endpoints.labeling.export(sessionId, "csv")}
          download
          className="px-2 py-1 rounded-md bg-surface hover:bg-panel-light text-text-secondary text-[10px] font-medium transition-colors"
        >
          {t("exportCsv")}
        </a>
        <a
          href={endpoints.labeling.export(sessionId, "json")}
          download
          className="px-2 py-1 rounded-md bg-surface hover:bg-panel-light text-text-secondary text-[10px] font-medium transition-colors"
        >
          {t("exportJson")}
        </a>
        <div className="flex items-center gap-2">
          <FileAudio className="w-3.5 h-3.5" />
          <span className="font-medium text-text-secondary">{activeFileName}</span>
        </div>
      </div>
    </div>
  );
}
