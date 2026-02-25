/** 전역 업로드 폴링 훅: 활성 잡이 있으면 3초 간격으로 상태를 폴링하고, 완료/실패 시 토스트 알림. */
"use client";

import { useEffect, useRef } from "react";
import { useUploadStore } from "@/lib/store/upload-store";
import { useUIStore } from "@/lib/store/ui-store";
import { endpoints } from "@/lib/api/endpoints";

interface ApiJobStatusResponse {
  jobId?: string;
  job_id?: string;
  status: string;
  progress?: number;
  error?: string | null;
}

const POLL_INTERVAL = 3000;

/**
 * 활성 업로드 잡(queued/processing)을 주기적으로 폴링하여 스토어를 갱신한다.
 * DashboardShell 레벨에서 한 번만 마운트한다.
 */
export function useUploadPolling(
  tDone: string,
  tFailed: string,
) {
  const { jobs, updateJob } = useUploadStore();
  const { showToast } = useUIStore();

  // Stable refs to avoid stale closures in setInterval
  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;
  const updateJobRef = useRef(updateJob);
  updateJobRef.current = updateJob;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const activeCount = jobs.filter(
    (j) => j.status === "queued" || j.status === "processing",
  ).length;

  useEffect(() => {
    if (activeCount === 0) return;

    const interval = setInterval(async () => {
      const active = jobsRef.current.filter(
        (j) => j.status === "queued" || j.status === "processing",
      );

      for (const job of active) {
        try {
          const res = await fetch(endpoints.jobs.status(job.jobId));
          if (!res.ok) continue;
          const data = (await res.json()) as ApiJobStatusResponse;

          const prevStatus = job.status;
          const newStatus = data.status;
          updateJobRef.current(job.jobId, {
            status: newStatus as typeof job.status,
            progress: data.progress ?? job.progress,
            error: data.error ?? undefined,
          });

          // Toast on transition to done/failed
          if (prevStatus !== "done" && newStatus === "done") {
            showToastRef.current(`${tDone}: ${job.filename}`);
          } else if (prevStatus !== "failed" && newStatus === "failed") {
            showToastRef.current(`${tFailed}: ${job.filename}`);
          }
        } catch {
          // Silently retry next interval
        }
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeCount, tDone, tFailed]);
}
