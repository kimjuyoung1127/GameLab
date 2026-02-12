const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const labelingEndpoints = {
  suggestions: (sessionId: string) => `${API_BASE}/labeling/${sessionId}/suggestions`,
  updateSuggestionStatus: (suggestionId: string) => `${API_BASE}/labeling/suggestions/${suggestionId}`,
} as const;
