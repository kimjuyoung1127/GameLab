/** 라벨링 API 클라이언트: AI 제안 조회, 상태 PATCH, 내보내기. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const labelingEndpoints = {
  suggestions: (sessionId: string) => `${API_BASE}/labeling/${sessionId}/suggestions`,
  createSuggestions: (sessionId: string) => `${API_BASE}/labeling/${sessionId}/suggestions`,
  updateSuggestionStatus: (suggestionId: string) => `${API_BASE}/labeling/suggestions/${suggestionId}`,
  updateSuggestion: (suggestionId: string) => `${API_BASE}/labeling/suggestions/${suggestionId}`,
  deleteSuggestion: (suggestionId: string) => `${API_BASE}/labeling/suggestions/${suggestionId}`,
  export: (sessionId: string, format: "csv" | "json" = "csv") =>
    `${API_BASE}/labeling/${sessionId}/export?format=${format}`,
} as const;
