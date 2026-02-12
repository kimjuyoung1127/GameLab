const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const jobsEndpoints = {
  status: (jobId: string) => `${API_BASE}/jobs/${jobId}`,
} as const;
