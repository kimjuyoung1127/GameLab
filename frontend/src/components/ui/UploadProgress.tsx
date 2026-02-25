/** 전역 업로드 진행 표시기: 활성 업로드가 있을 때 화면 우하단에 진행 상태를 표시한다. */
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { useUploadStore } from "@/lib/store/upload-store";
import { useUploadPolling } from "@/lib/hooks/use-upload-polling";

export default function UploadProgress() {
  const t = useTranslations("uploadProgress");
  const { jobs, collapsed, removeJob, clearCompleted, toggleCollapsed } =
    useUploadStore();

  // Activate global polling
  useUploadPolling(t("complete"), t("failed"));

  if (jobs.length === 0) return null;

  const activeCount = jobs.filter(
    (j) => j.status === "queued" || j.status === "processing",
  ).length;
  const doneCount = jobs.filter((j) => j.status === "done").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 rounded-lg border border-border bg-panel shadow-xl shadow-black/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text">
          {activeCount > 0
            ? t("inProgress", { count: activeCount })
            : doneCount > 0 && failedCount === 0
              ? t("allComplete")
              : t("title")}
        </span>
        <div className="flex items-center gap-1">
          {doneCount + failedCount > 0 && activeCount === 0 && (
            <button
              onClick={clearCompleted}
              className="text-[10px] text-text-muted hover:text-text transition-colors px-1"
            >
              {t("clear")}
            </button>
          )}
          <button
            onClick={toggleCollapsed}
            className="p-0.5 text-text-muted hover:text-text transition-colors"
            aria-label={t("collapse")}
          >
            {collapsed ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Job list */}
      {!collapsed && (
        <div className="max-h-48 overflow-y-auto">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className="flex items-center gap-2 px-3 py-2 border-b border-border/50 last:border-b-0"
            >
              {/* Status icon */}
              <div className="shrink-0">
                {job.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                ) : job.status === "failed" ? (
                  <XCircle className="w-4 h-4 text-danger" />
                ) : (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text truncate">{job.filename}</p>
                {(job.status === "queued" || job.status === "processing") && (
                  <div className="mt-1 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                {job.status === "failed" && job.error && (
                  <p className="text-[10px] text-danger truncate mt-0.5">
                    {job.error}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0">
                {job.status === "done" ? (
                  <Link
                    href={`/labeling/${job.sessionId}`}
                    className="text-[10px] text-primary hover:underline whitespace-nowrap"
                  >
                    {t("openLabeling")}
                  </Link>
                ) : job.status === "failed" ? (
                  <button
                    onClick={() => removeJob(job.jobId)}
                    className="p-0.5 text-text-muted hover:text-text transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
