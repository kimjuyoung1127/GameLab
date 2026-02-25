/** Top toolbar with tools, zoom, undo/redo, save, export dropdown and file indicator. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, FileAudio, Redo2, Undo2 } from "lucide-react";
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
  onSaveManualDrafts: () => Promise<void>;
  pendingDraftCount: number;
  bookmarkCount: number;
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
  pendingDraftCount,
  bookmarkCount,
}: ToolBarProps) {
  const t = useTranslations("labeling");
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setExportOpen(false), []);

  useEffect(() => {
    if (!exportOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen, closeDropdown]);

  const LABELED_STATUS = "confirmed,corrected";

  /** Save pending drafts first if needed, then trigger download. */
  const handleExport = useCallback(
    async (url: string) => {
      if (pendingDraftCount > 0) {
        setSaving(true);
        try {
          await onSaveManualDrafts();
        } finally {
          setSaving(false);
        }
      }
      closeDropdown();
      // Brief delay to let DB write settle before fetching export
      await new Promise((r) => setTimeout(r, 300));
      window.open(url, "_blank");
    },
    [pendingDraftCount, onSaveManualDrafts, closeDropdown],
  );

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
        {bookmarkCount > 0 && (
          <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full">
            {t("bookmarkCount", { count: bookmarkCount })}
          </span>
        )}
        <button
          onClick={onSaveManualDrafts}
          className="px-2 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-[10px] font-semibold transition-colors"
          title={t("manualSaveTitle")}
        >
          {t("manualSaveButton")}
        </button>

        {/* Export dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setExportOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface hover:bg-panel-light text-text-secondary text-[10px] font-medium transition-colors"
          >
            {t("exportMenu")}
            <ChevronDown className="w-3 h-3" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-panel border border-border rounded-lg shadow-xl z-50 py-1">
              {pendingDraftCount > 0 && (
                <div className="px-3 py-1.5 text-[10px] text-warning bg-warning/10 border-b border-border-light">
                  {t("exportUnsavedWarning", { count: pendingDraftCount })}
                </div>
              )}
              {saving && (
                <div className="px-3 py-1.5 text-[10px] text-primary-light bg-primary/10 border-b border-border-light">
                  {t("exportSavingDrafts")}
                </div>
              )}
              <button
                onClick={() => void handleExport(endpoints.labeling.export(sessionId, "csv"))}
                disabled={saving}
                className="block w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-panel-light hover:text-text transition-colors disabled:opacity-50"
              >
                {t("exportAllCsv")}
              </button>
              <button
                onClick={() => void handleExport(endpoints.labeling.export(sessionId, "json"))}
                disabled={saving}
                className="block w-full text-left px-3 py-1.5 text-[11px] text-text-secondary hover:bg-panel-light hover:text-text transition-colors disabled:opacity-50"
              >
                {t("exportAllJson")}
              </button>
              <div className="h-px bg-border-light mx-2 my-1" />
              <button
                onClick={() => void handleExport(endpoints.labeling.export(sessionId, "csv", { status: LABELED_STATUS }))}
                disabled={saving}
                className="block w-full text-left px-3 py-1.5 text-[11px] text-accent hover:bg-panel-light transition-colors disabled:opacity-50"
              >
                {t("exportLabeledCsv")}
              </button>
              <button
                onClick={() => void handleExport(endpoints.labeling.export(sessionId, "json", { status: LABELED_STATUS }))}
                disabled={saving}
                className="block w-full text-left px-3 py-1.5 text-[11px] text-accent hover:bg-panel-light transition-colors disabled:opacity-50"
              >
                {t("exportLabeledJson")}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FileAudio className="w-3.5 h-3.5" />
          <span className="font-medium text-text-secondary">{activeFileName}</span>
        </div>
      </div>
    </div>
  );
}
