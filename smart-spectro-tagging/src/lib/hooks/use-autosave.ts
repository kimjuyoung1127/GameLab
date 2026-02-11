"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAnnotationStore } from "@/lib/store/annotation-store";

const AUTOSAVE_KEY = "sst-autosave";
const OFFLINE_QUEUE_KEY = "sst-offline-queue";
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds

interface SavedProgress {
  audioId: string;
  suggestions: ReturnType<typeof useAnnotationStore.getState>["suggestions"];
  savedAt: string;
}

interface OfflineQueueItem {
  type: "confirm" | "reject" | "fix";
  suggestionId: string;
  audioId: string;
  timestamp: string;
}

/** Read the offline queue from localStorage */
export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Push an action to the offline queue (to be synced when API is available) */
export function enqueueOfflineAction(item: Omit<OfflineQueueItem, "timestamp">) {
  const queue = getOfflineQueue();
  queue.push({ ...item, timestamp: new Date().toISOString() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/** Clear the offline queue (call after successful API sync) */
export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Hook that auto-saves annotation progress to localStorage every 30s.
 * Also saves on beforeunload to prevent data loss.
 */
export function useAutosave(audioId: string | null) {
  const lastSavedRef = useRef<string>("");

  const save = useCallback(() => {
    if (!audioId) return;
    const { suggestions } = useAnnotationStore.getState();
    const payload: SavedProgress = {
      audioId,
      suggestions,
      savedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(payload);
    if (json === lastSavedRef.current) return; // no changes
    localStorage.setItem(AUTOSAVE_KEY, json);
    lastSavedRef.current = json;
  }, [audioId]);

  // Periodic autosave
  useEffect(() => {
    if (!audioId) return;
    const id = setInterval(save, AUTOSAVE_INTERVAL);
    return () => clearInterval(id);
  }, [audioId, save]);

  // Save on tab close / navigation
  useEffect(() => {
    const handleBeforeUnload = () => save();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [save]);

  return { save };
}

/** Load saved progress from localStorage for a given audioId */
export function loadSavedProgress(audioId: string): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed: SavedProgress = JSON.parse(raw);
    if (parsed.audioId !== audioId) return null;
    return parsed;
  } catch {
    return null;
  }
}
