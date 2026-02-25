/** 업로드 잡 상태 관리: 페이지 이탈 후에도 분석 진행 상태를 전역으로 추적한다. persist 미들웨어. */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UploadJobStatus } from "@/types";

export interface UploadJob {
  jobId: string;
  fileId: string;
  filename: string;
  sessionId: string;
  status: UploadJobStatus;
  progress: number;
  error?: string;
}

interface UploadState {
  jobs: UploadJob[];
  collapsed: boolean;
  addJobs: (jobs: UploadJob[]) => void;
  updateJob: (jobId: string, patch: Partial<UploadJob>) => void;
  removeJob: (jobId: string) => void;
  clearCompleted: () => void;
  toggleCollapsed: () => void;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      jobs: [],
      collapsed: false,

      addJobs: (newJobs) =>
        set((s) => ({ jobs: [...s.jobs, ...newJobs] })),

      updateJob: (jobId, patch) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j)),
        })),

      removeJob: (jobId) =>
        set((s) => ({ jobs: s.jobs.filter((j) => j.jobId !== jobId) })),

      clearCompleted: () =>
        set((s) => ({
          jobs: s.jobs.filter((j) => j.status !== "done" && j.status !== "failed"),
        })),

      toggleCollapsed: () =>
        set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: "sst-uploads",
      version: 1,
      partialize: (state) => ({ jobs: state.jobs }),
      migrate: () => ({ jobs: [] }),
    },
  ),
);
