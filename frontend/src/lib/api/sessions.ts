/** 세션 API 클라이언트: 목록 조회, 파일 조회, 삭제. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const sessionsEndpoints = {
  list: `${API_BASE}/sessions`,
  files: (sessionId: string) => `${API_BASE}/sessions/${sessionId}/files`,
  delete: (sessionId: string) => `${API_BASE}/sessions/${sessionId}`,
} as const;
