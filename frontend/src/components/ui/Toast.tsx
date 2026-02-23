/** 글로벌 Toast: ui-store의 toastMessage를 화면 하단 오른쪽에 3초간 표시. */
"use client";

import { useUIStore } from "@/lib/store/ui-store";
import { X } from "lucide-react";

export default function Toast() {
  const { toastMessage, clearToast } = useUIStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3 shadow-xl shadow-black/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <p className="text-sm text-text">{toastMessage}</p>
      <button
        onClick={clearToast}
        className="shrink-0 rounded p-0.5 text-text-muted hover:text-text transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
