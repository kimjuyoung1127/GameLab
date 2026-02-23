/** 핫키 스팸 방어 큐: 직렬 처리, 중복 병합, 오프라인 localStorage 폴백. */
import { labelingEndpoints } from "./labeling";
import type { SuggestionStatus } from "@/types/labeling";

interface QueueItem {
  requestId: string;
  suggestionId: string;
  targetStatus: SuggestionStatus;
  clientTs: string;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const OFFLINE_KEY = "sst-offline-queue";

const queue: QueueItem[] = [];
let flushing = false;
let initialized = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Enqueue a status update. Coalesces repeated actions for the same suggestion. */
export function enqueueStatusUpdate(suggestionId: string, targetStatus: SuggestionStatus): void {
  ensureInitialized();
  const startIdx = flushing ? 1 : 0;
  const existingIdx = queue.findIndex((q, idx) => idx >= startIdx && q.suggestionId === suggestionId);
  const item: QueueItem = {
    requestId: generateId(),
    suggestionId,
    targetStatus,
    clientTs: new Date().toISOString(),
    retryCount: 0,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }

  void flush();
}

/** Serialized flush: process one item at a time to guarantee ordering. */
async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;

  while (queue.length > 0) {
    const item = queue[0];
    try {
      const res = await fetch(labelingEndpoints.updateSuggestionStatus(item.suggestionId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: item.targetStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      queue.shift();
    } catch {
      item.retryCount += 1;
      if (item.retryCount >= MAX_RETRIES) {
        persistToOfflineQueue(item);
        queue.shift();
      } else {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  flushing = false;
}

function persistToOfflineQueue(item: QueueItem): void {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
    existing.push({
      type: item.targetStatus === "confirmed" ? "confirm" : item.targetStatus === "rejected" ? "reject" : "fix",
      suggestionId: item.suggestionId,
      audioId: "",
      timestamp: item.clientTs,
    });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage full or unavailable
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  hydrateFromOfflineQueue();
  void flush();
  window.addEventListener("online", () => {
    hydrateFromOfflineQueue();
    void flush();
  });
}

function hydrateFromOfflineQueue(): void {
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    if (!raw) return;
    const items = JSON.parse(raw) as Array<{
      type: "confirm" | "reject" | "fix";
      suggestionId: string;
      timestamp?: string;
    }>;
    localStorage.removeItem(OFFLINE_KEY);

    for (const item of items) {
      const targetStatus: SuggestionStatus =
        item.type === "confirm" ? "confirmed" : item.type === "reject" ? "rejected" : "corrected";
      const startIdx = flushing ? 1 : 0;
      const existingIdx = queue.findIndex((q, idx) => idx >= startIdx && q.suggestionId === item.suggestionId);
      const queued: QueueItem = {
        requestId: generateId(),
        suggestionId: item.suggestionId,
        targetStatus,
        clientTs: item.timestamp ?? new Date().toISOString(),
        retryCount: 0,
      };
      if (existingIdx >= 0) {
        queue[existingIdx] = queued;
      } else {
        queue.push(queued);
      }
    }
  } catch {
    // ignore corrupted localStorage payload
  }
}

ensureInitialized();
