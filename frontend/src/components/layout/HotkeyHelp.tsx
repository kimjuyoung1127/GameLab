/** 단축키 도움말 오버레이: 전역 스토어 기반 열기/닫기, i18n 지원. */
"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Keyboard, X } from "lucide-react";
import { useUIStore } from "@/lib/store/ui-store";

const ONBOARDING_KEY = "sst-onboarding-shown";

export default function HotkeyHelp() {
  const { hotkeyHelpOpen, toggleHotkeyHelp } = useUIStore();
  const t = useTranslations("hotkeys");

  const sections = [
    {
      title: t("labeling"),
      keys: [
        { key: "O", desc: t("confirmSuggestion") },
        { key: "X", desc: t("rejectSuggestion") },
        { key: "F", desc: t("applyFix") },
      ],
    },
    {
      title: t("tools"),
      keys: [
        { key: "S", desc: t("selectTool") },
        { key: "B", desc: t("brushTool") },
        { key: "E", desc: t("eraserTool") },
        { key: "R", desc: t("boxTool") },
        { key: "A", desc: t("anchorTool") },
      ],
    },
    {
      title: t("playback"),
      keys: [
        { key: "Space", desc: t("playPause") },
        { key: "Shift+\u2191", desc: t("volumeUp") },
        { key: "Shift+\u2193", desc: t("volumeDown") },
        { key: "[ / ]", desc: t("playbackSpeed") },
        { key: "I / P / L", desc: "Loop in/out/toggle" },
      ],
    },
    {
      title: t("zoom"),
      keys: [
        { key: "+ / =", desc: t("zoomIn") },
        { key: "-", desc: t("zoomOut") },
      ],
    },
    {
      title: t("navigation"),
      keys: [
        { key: "Tab", desc: t("nextSuggestion") },
        { key: "Shift+Tab", desc: t("prevSuggestion") },
        { key: "\u2191 / \u2193", desc: t("navigateSuggestions") },
        { key: "Ctrl+\u2192", desc: t("nextFile") },
        { key: "Ctrl+\u2190", desc: t("prevFile") },
      ],
    },
    {
      title: t("actions"),
      keys: [
        { key: "Ctrl+Z", desc: t("undo") },
        { key: "Ctrl+Shift+Z", desc: t("redo") },
        { key: "Ctrl+Enter", desc: t("saveNextFile") },
        { key: "?", desc: t("togglePanel") },
      ],
    },
    {
      title: t("globalNav"),
      keys: [
        { key: "Alt+1", desc: t("globalOverview") },
        { key: "Alt+2", desc: t("globalUpload") },
        { key: "Alt+3", desc: t("globalSessions") },
        { key: "Alt+4", desc: t("globalLeaderboard") },
      ],
    },
  ];

  // Show on first visit
  useEffect(() => {
    const shown = localStorage.getItem(ONBOARDING_KEY);
    if (!shown) {
      toggleHotkeyHelp();
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
  }, [toggleHotkeyHelp]);

  // Listen for ? key and Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        toggleHotkeyHelp();
      }
      if (e.key === "Escape" && hotkeyHelpOpen) {
        toggleHotkeyHelp();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkeyHelpOpen, toggleHotkeyHelp]);

  const close = useCallback(() => {
    if (hotkeyHelpOpen) toggleHotkeyHelp();
  }, [hotkeyHelpOpen, toggleHotkeyHelp]);

  if (!hotkeyHelpOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      {/* Panel */}
      <div className="fixed right-4 top-4 bottom-4 z-50 w-80 bg-panel border border-border rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text">{t("title")}</h2>
          </div>
          <button
            onClick={close}
            className="p-1 rounded-lg hover:bg-panel-light transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                {section.title}
              </p>
              <div className="space-y-1.5">
                {section.keys.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-text-secondary">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-surface border border-border text-xs font-mono text-text">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-text-muted text-center">
            {t("toggleHint")}
          </p>
        </div>
      </div>
    </>
  );
}
