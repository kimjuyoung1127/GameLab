/** 대시보드 개요 API 클라이언트: 세션/파일/정확도 메트릭스 조회. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const overviewEndpoints = {
  metrics: `${API_BASE}/overview/metrics`,
} as const;
