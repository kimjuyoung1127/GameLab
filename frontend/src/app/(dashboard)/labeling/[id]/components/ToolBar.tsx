/** Toolbar in center panel: draw tools, zoom controls, undo/redo, export links. */
import { FileAudio, Redo2, Undo2 } from "lucide-react";
import type { DrawTool } from "@/types";
import { endpoints } from "@/lib/api/endpoints";
import { tools, zoomTools } from "./constants";

type ToolBarProps = {
  tool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  zoomLevel: number;
  onZoomLevelChange: (updater: (current: number) => number) => void;
  confirmedCount: number;
  totalCount: number;
  sessionId: string;
  activeFileName?: string;
  styles: Record<string, string>;
};

export default function ToolBar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  zoomLevel,
  onZoomLevelChange,
  confirmedCount,
  totalCount,
  sessionId,
  activeFileName,
  styles,
}: ToolBarProps) {
  return (
    <div className={styles.c045}>
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          title={`${t.label} (${t.hotkey})`}
          className={`p-2 rounded-md transition-colors ${
            tool === t.id ? "bg-primary text-white" : "text-text-secondary hover:bg-panel-light hover:text-text"
          }`}
        >
          <t.icon className={styles.c046} />
        </button>
      ))}

      <div className={styles.c047} />

      {zoomTools.map((t) => (
        <button
          key={t.id}
          title={`${t.label} (${zoomLevel.toFixed(2)}x)`}
          className={styles.c048}
          onClick={() =>
            onZoomLevelChange((z) =>
              t.id === "zoom-in" ? Math.min(z + 0.25, 3.0) : Math.max(z - 0.25, 0.5),
            )
          }
        >
          <t.icon className={styles.c046} />
        </button>
      ))}

      <div className={styles.c047} />

      <button onClick={onUndo} title="Undo (Ctrl+Z)" className={styles.c048}>
        <Undo2 className={styles.c046} />
      </button>
      <button onClick={onRedo} title="Redo (Ctrl+Shift+Z)" className={styles.c048}>
        <Redo2 className={styles.c046} />
      </button>

      <div className={styles.c049}>
        <span className={styles.c050}>
          {confirmedCount}/{totalCount} tagged
        </span>
        <a href={endpoints.labeling.export(sessionId, "csv")} download className={styles.c051}>
          CSV
        </a>
        <a href={endpoints.labeling.export(sessionId, "json")} download className={styles.c051}>
          JSON
        </a>
        <div className={styles.c052}>
          <FileAudio className={styles.c053} />
          <span className={styles.c054}>{activeFileName}</span>
        </div>
      </div>
    </div>
  );
}
