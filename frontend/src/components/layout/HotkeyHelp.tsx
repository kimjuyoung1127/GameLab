"use client";

import { useCallback, useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";

const HOTKEY_SECTIONS = [
  {
    title: "Labeling",
    keys: [
      { key: "O", desc: "Confirm suggestion" },
      { key: "X", desc: "Reject suggestion" },
      { key: "F", desc: "Apply fix" },
    ],
  },
  {
    title: "Tools",
    keys: [
      { key: "S", desc: "Select tool" },
      { key: "B", desc: "Brush tool" },
      { key: "E", desc: "Eraser tool" },
      { key: "R", desc: "Box tool" },
      { key: "A", desc: "Anchor tool" },
    ],
  },
  {
    title: "Playback",
    keys: [
      { key: "Space", desc: "Play / Pause (region if selected)" },
    ],
  },
  {
    title: "Navigation",
    keys: [
      { key: "Tab", desc: "Next suggestion" },
      { key: "Shift+Tab", desc: "Previous suggestion" },
      { key: "↑ / ↓", desc: "Navigate suggestions" },
    ],
  },
  {
    title: "Actions",
    keys: [
      { key: "Ctrl+Z", desc: "Undo" },
      { key: "Ctrl+Shift+Z", desc: "Redo" },
      { key: "?", desc: "Toggle this panel" },
    ],
  },
];

const ONBOARDING_KEY = "sst-onboarding-shown";

export default function HotkeyHelp() {
  const [open, setOpen] = useState(false);

  // Show on first visit
  useEffect(() => {
    const shown = localStorage.getItem(ONBOARDING_KEY);
    if (!shown) {
      setOpen(true);
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
  }, []);

  // Listen for ? key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  if (!open) return null;

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
            <h2 className="text-sm font-semibold text-text">Keyboard Shortcuts</h2>
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
          {HOTKEY_SECTIONS.map((section) => (
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
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono">?</kbd> to toggle
          </p>
        </div>
      </div>
    </>
  );
}
