/** LLM Assist 자동 프리페치: 페이지 로드 시 pending 제안에 대해 배치 요청. */
"use client";

import { useEffect, useRef } from "react";
import type { LlmBatchAssistResponse } from "@/types";
import { labelingEndpoints } from "@/lib/api/labeling";
import { authFetch } from "@/lib/api/auth-fetch";
import { useAnnotationStore } from "@/lib/store/annotation-store";

const LLM_TRIGGER_MAX_CONFIDENCE = 70;

export function useLlmPrefetch(sessionId: string | null) {
  const suggestions = useAnnotationStore((s) => s.suggestions);
  const autoPrefetchEnabled = useAnnotationStore((s) => s.autoPrefetchEnabled);
  const assistMap = useAnnotationStore((s) => s.assistMap);
  const assistStatusMap = useAnnotationStore((s) => s.assistStatusMap);
  const setBulkAssistResults = useAnnotationStore((s) => s.setBulkAssistResults);
  const setBulkAssistStatus = useAnnotationStore((s) => s.setBulkAssistStatus);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sessionId || !autoPrefetchEnabled || suggestions.length === 0) return;

    // pending + 저신뢰도 필터
    const candidates = suggestions.filter(
      (s) =>
        s.status === "pending" &&
        s.confidence <= LLM_TRIGGER_MAX_CONFIDENCE &&
        !assistMap[s.id] &&
        assistStatusMap[s.id] !== "loading",
    );

    if (candidates.length === 0) return;

    const ids = candidates.map((s) => s.id);
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        // 1) 벌크 캐시 조회
        setBulkAssistStatus(ids, "loading");
        const cacheRes = await authFetch(
          labelingEndpoints.getAssistBatch(sessionId, ids),
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        let cachedIds: Set<string> = new Set();
        if (cacheRes.ok) {
          const cacheData: LlmBatchAssistResponse = await cacheRes.json();
          if (controller.signal.aborted) return;
          if (cacheData.results?.length > 0) {
            setBulkAssistResults(cacheData.results);
            cachedIds = new Set(cacheData.results.map((r) => r.suggestionId));
          }
        }

        // 2) 캐시 미스 → 배치 POST
        const uncachedIds = ids.filter((id) => !cachedIds.has(id));
        if (uncachedIds.length === 0 || controller.signal.aborted) return;

        const batchRes = await authFetch(
          labelingEndpoints.assistBatch(sessionId),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ suggestionIds: uncachedIds, inputMode: "audio_clip" }),
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        if (batchRes.ok) {
          const batchData: LlmBatchAssistResponse = await batchRes.json();
          if (controller.signal.aborted) return;
          if (batchData.results?.length > 0) {
            setBulkAssistResults(batchData.results);
          }
          // 에러 항목 상태 업데이트
          if (batchData.errors?.length > 0) {
            const errorIds = batchData.errors.map((e) => e.suggestionId);
            setBulkAssistStatus(errorIds, "error");
          }
        } else {
          // 전체 실패 → idle로 롤백
          setBulkAssistStatus(uncachedIds, "idle");
        }
      } catch {
        if (!controller.signal.aborted) {
          setBulkAssistStatus(ids, "idle");
        }
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, suggestions.length, autoPrefetchEnabled]);
}
