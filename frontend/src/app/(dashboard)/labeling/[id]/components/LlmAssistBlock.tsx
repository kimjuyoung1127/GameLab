/** LLM Assist 블록: 스토어 기반 assist 결과 표시 + 수동 요청/재분석 버튼. */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Suggestion, SuggestionLlmAssist } from "@/types";
import { labelingEndpoints } from "@/lib/api/labeling";
import { authFetch } from "@/lib/api/auth-fetch";
import { useAnnotationStore } from "@/lib/store/annotation-store";
import { useUIStore } from "@/lib/store/ui-store";

type LlmAssistBlockProps = {
  suggestion: Suggestion | null;
};

export default function LlmAssistBlock({ suggestion }: LlmAssistBlockProps) {
  const t = useTranslations("labeling");

  // 스토어에서 프리페치 결과 읽기
  const storeResult = useAnnotationStore((s) =>
    suggestion ? s.assistMap[suggestion.id] : undefined,
  );
  const storeStatus = useAnnotationStore((s) =>
    suggestion ? s.assistStatusMap[suggestion.id] ?? "idle" : "idle",
  );
  const setAssistResult = useAnnotationStore((s) => s.setAssistResult);

  // 로컬: 캐시 확인 중 + 수동 요청 중 로딩
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkedId, setCheckedId] = useState<string | null>(null);

  // suggestion 변경 시 캐시 확인 (스토어에 결과 없을 때만)
  useEffect(() => {
    if (!suggestion || suggestion.status !== "pending") {
      setCheckedId(null);
      return;
    }
    if (storeResult || storeStatus === "loading") {
      setCheckedId(suggestion.id);
      return;
    }
    if (suggestion.id === checkedId) return;

    let cancelled = false;
    setLocalLoading(true);

    (async () => {
      try {
        const res = await authFetch(labelingEndpoints.getAssist(suggestion.id));
        if (cancelled) return;

        if (res.ok && res.status !== 204) {
          const data: SuggestionLlmAssist = await res.json();
          if (data) {
            setAssistResult(suggestion.id, data);
            setCheckedId(suggestion.id);
            setLocalLoading(false);
            return;
          }
        }
        setCheckedId(suggestion.id);
        setLocalLoading(false);
      } catch {
        if (!cancelled) setLocalLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [suggestion?.id, suggestion?.status, storeResult, storeStatus, setAssistResult]);

  const requestAssist = useCallback(async () => {
    if (!suggestion) return;
    setLocalLoading(true);
    setError("");

    try {
      const res = await authFetch(labelingEndpoints.requestAssist(suggestion.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputMode: "audio_clip" }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `HTTP ${res.status}`);
      }

      const data: SuggestionLlmAssist = await res.json();
      setAssistResult(suggestion.id, data);
      setLocalLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLocalLoading(false);
      useUIStore.getState().showToast(t("llmAssistError"));
    }
  }, [suggestion, t, setAssistResult]);

  if (!suggestion || suggestion.status !== "pending") return null;

  // 실제 표시할 결과와 상태 결정
  const result = storeResult ?? null;
  const isLoading = localLoading || storeStatus === "loading";
  const hasError = !isLoading && !result && error;

  // 캐시 확인 or 프리페치 로딩
  if (isLoading && !result) {
    return (
      <div className="px-4 py-2 flex items-center gap-2 text-text-muted">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-[10px]">AI...</span>
      </div>
    );
  }

  // 에러 상태
  if (hasError) {
    return (
      <div className="px-4 py-2">
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
          <p className="text-xs text-danger mb-2">{t("llmAssistError")}</p>
          {error && <p className="text-[10px] text-text-muted mb-2 break-all">{error}</p>}
          <button
            onClick={requestAssist}
            className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger/80 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t("llmAssistRetry")}
          </button>
        </div>
      </div>
    );
  }

  // 결과 있으면 표시
  if (result) {
    const actionConfig = {
      confirm: { label: t("llmAssistConfirm"), bg: "bg-accent/10", border: "border-accent/30", text: "text-accent" },
      reject: { label: t("llmAssistReject"), bg: "bg-danger/10", border: "border-danger/30", text: "text-danger" },
      fix: { label: t("llmAssistFix"), bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
    }[result.recommendedAction];

    return (
      <div className="px-4 py-2">
        <div className={`${actionConfig.bg} border ${actionConfig.border} rounded-xl p-3`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className={`w-3.5 h-3.5 ${actionConfig.text}`} />
              <span className={`text-xs font-bold ${actionConfig.text}`}>{actionConfig.label}</span>
            </div>
            <span className="text-[10px] text-text-muted">
              {t("llmAssistConfidence", { confidence: result.llmConfidence })}
            </span>
          </div>

          <p className="text-[11px] text-text-secondary leading-relaxed mb-2">{result.explanation}</p>

          {result.recommendedAction === "fix" && result.suggestedLabel && (
            <p className="text-[10px] text-warning font-medium mb-2">
              {t("llmAssistSuggestedLabel", { label: result.suggestedLabel })}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[9px] text-text-muted">
              {t("llmAssistLatency", { ms: result.latencyMs })}
            </span>
            <button
              onClick={requestAssist}
              title={t("llmAssistReanalyze")}
              className="p-1 rounded text-text-muted hover:text-violet-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // idle — 요청 버튼
  return (
    <div className="px-4 py-2">
      <button
        onClick={requestAssist}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-xs font-semibold transition-colors"
      >
        <Bot className="w-3.5 h-3.5" />
        {t("llmAssistButton")}
      </button>
    </div>
  );
}
