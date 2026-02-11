const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const endpoints = {
  upload: {
    files: `${API_BASE}/upload/files`,
  },
  jobs: {
    status: (jobId: string) => `${API_BASE}/jobs/${jobId}`,
  },
  overview: {
    metrics: `${API_BASE}/overview/metrics`,
  },
  sessions: {
    list: `${API_BASE}/sessions`,
    files: (sessionId: string) => `${API_BASE}/sessions/${sessionId}/files`,
  },
  labeling: {
    suggestions: (sessionId: string) => `${API_BASE}/labeling/${sessionId}/suggestions`,
  },
  leaderboard: `${API_BASE}/leaderboard`,
} as const;
