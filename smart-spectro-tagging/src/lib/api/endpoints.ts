// Phase 2 API endpoints - currently using mock data
// Replace these with actual API calls when FastAPI backend is ready

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const endpoints = {
  sessions: {
    list: `${API_BASE}/sessions`,
    create: `${API_BASE}/sessions/create`,
    get: (id: string) => `${API_BASE}/sessions/${id}`,
  },
  audio: {
    upload: `${API_BASE}/audio/upload`,
  },
  ai: {
    analyze: `${API_BASE}/ai/analyze-audio`,
    suggestions: (audioId: string) => `${API_BASE}/ai/suggestions/${audioId}`,
  },
  suggestions: {
    confirm: `${API_BASE}/suggestions/confirm`,
    reject: `${API_BASE}/suggestions/reject`,
  },
  annotations: {
    save: `${API_BASE}/annotations/save`,
  },
  leaderboard: `${API_BASE}/leaderboard`,
} as const;
