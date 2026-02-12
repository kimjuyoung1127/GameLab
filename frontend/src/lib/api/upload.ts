const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const uploadEndpoints = {
  files: `${API_BASE}/upload/files`,
} as const;
