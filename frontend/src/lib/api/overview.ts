const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const overviewEndpoints = {
  metrics: `${API_BASE}/overview/metrics`,
} as const;
