/** 잡 상태 API 클라이언트: GET /api/jobs/{jobId} 폴링. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const jobsEndpoints = {
  status: (jobId: string) => `${API_BASE}/jobs/${jobId}`,
} as const;
