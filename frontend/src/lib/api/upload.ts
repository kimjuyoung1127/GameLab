/** 업로드 API 클라이언트: POST /api/upload/files 멀티파트 업로드. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const uploadEndpoints = {
  files: `${API_BASE}/upload/files`,
} as const;
