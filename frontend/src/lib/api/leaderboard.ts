/** 리더보드 API 클라이언트: 사용자 랭킹 조회 + 내 점수 조회. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const leaderboardEndpoints = {
  list: `${API_BASE}/leaderboard`,
  me: `${API_BASE}/leaderboard/me`,
} as const;

/** Fetch current user's score from server. */
export async function fetchMyScore(): Promise<{
  todayScore: number;
  accuracy: number;
  allTimeScore: number;
} | null> {
  try {
    const res = await fetch(leaderboardEndpoints.me);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
