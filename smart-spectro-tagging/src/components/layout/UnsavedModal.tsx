"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function UnsavedModal() {
  const [show, setShow] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Browser beforeunload
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      const unsaved = sessionStorage.getItem("sst-unsaved");
      if (unsaved === "true") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Intercept internal link navigation when unsaved flag is active.
  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      const unsaved = sessionStorage.getItem("sst-unsaved");
      if (unsaved !== "true") return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`;

      if (nextUrl.origin !== window.location.origin || nextPath === currentPath) return;

      e.preventDefault();
      setPendingUrl(nextPath);
      setShow(true);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  const handleStay = useCallback(() => {
    setShow(false);
    setPendingUrl(null);
  }, []);

  const handleLeave = useCallback(() => {
    sessionStorage.removeItem("sst-unsaved");
    setShow(false);
    if (pendingUrl) {
      window.location.assign(pendingUrl);
    }
  }, [pendingUrl]);

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-panel border border-border rounded-2xl shadow-2xl shadow-black/30 w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">Unsaved Changes</h3>
              <p className="text-xs text-text-muted">You have unsaved changes.</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary">
            Leaving this page now may discard your current work. Do you want to continue?
          </p>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={handleStay}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text bg-surface hover:bg-panel-light border border-border rounded-lg transition-colors"
            >
              Stay
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger-dark rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
