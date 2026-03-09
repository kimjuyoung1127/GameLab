/** 제안 로딩 훅: 재시도 + 파일별 진행률 집계, authFetch 기반. */
"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api/auth-fetch";
import { loadSavedProgress } from "@/lib/hooks/use-autosave";
import { endpoints } from "@/lib/api/endpoints";
import type { Suggestion } from "@/types";

type UseLabelingSuggestionsParams = {
  sessionId: string;
  activeFileId: string | null;
  loadSuggestions: (items: Suggestion[]) => void;
  restoreSuggestions: (items: Suggestion[]) => void;
};

export function useLabelingSuggestions({
  sessionId,
  activeFileId,
  loadSuggestions,
  restoreSuggestions,
}: UseLabelingSuggestionsParams) {
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [fileProgressMap, setFileProgressMap] = useState<Record<string, { total: number; reviewed: number }>>({});

  useEffect(() => {
    if (!sessionId || !activeFileId) return;
    setSuggestionError(null);
    let cancelled = false;

    const loadSuggestionData = async (retryCount = 0): Promise<void> => {
      try {
        const res = await authFetch(endpoints.labeling.suggestions(sessionId));
        if (!res.ok) throw new Error("Failed to load suggestions");
        const allRaw = (await res.json()) as Suggestion[];
        const all = allRaw.map((s) => ({ ...s, source: s.source ?? "ai", createdBy: s.createdBy ?? null } as Suggestion));
        const filtered = all.filter((s) => s.audioId === activeFileId);

        if (filtered.length === 0 && retryCount < 5 && !cancelled) {
          await new Promise((r) => setTimeout(r, 3000));
          if (!cancelled) return loadSuggestionData(retryCount + 1);
          return;
        }
        if (cancelled) return;

        const progressMap: Record<string, { total: number; reviewed: number }> = {};
        for (const s of all) {
          if (!progressMap[s.audioId]) progressMap[s.audioId] = { total: 0, reviewed: 0 };
          progressMap[s.audioId].total++;
          if (s.status !== "pending") progressMap[s.audioId].reviewed++;
        }
        setFileProgressMap(progressMap);

        loadSuggestions(filtered);

        const saved = loadSavedProgress(activeFileId);
        if (saved?.suggestions?.length) restoreSuggestions(saved.suggestions);
      } catch (err) {
        if (cancelled) return;
        loadSuggestions([]);
        setSuggestionError((err as Error).message || "Failed to load suggestions");
      }
    };

    void loadSuggestionData();
    return () => {
      cancelled = true;
    };
  }, [activeFileId, loadSuggestions, restoreSuggestions, sessionId]);

  return {
    suggestionError,
    fileProgressMap,
  };
}
