import { authFetch } from "./auth-fetch";
import type { ClaimMissionResponse, GamificationSnapshot, MissionsResponse } from "@/types/gamification";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const gamificationEndpoints = {
  me: `${API_BASE}/gamification/me`,
  missions: `${API_BASE}/gamification/missions`,
  claim: (missionId: string) => `${API_BASE}/gamification/missions/${missionId}/claim`,
} as const;

export async function fetchGamificationSnapshot(): Promise<GamificationSnapshot | null> {
  try {
    const res = await authFetch(gamificationEndpoints.me);
    if (!res.ok) return null;
    return (await res.json()) as GamificationSnapshot;
  } catch {
    return null;
  }
}

export async function fetchMissions(): Promise<MissionsResponse> {
  try {
    const res = await authFetch(gamificationEndpoints.missions);
    if (!res.ok) return { daily: [], weekly: [] };
    return (await res.json()) as MissionsResponse;
  } catch {
    return { daily: [], weekly: [] };
  }
}

export async function claimMission(missionId: string): Promise<ClaimMissionResponse | null> {
  try {
    const res = await authFetch(gamificationEndpoints.claim(missionId), { method: "POST" });
    if (!res.ok) return null;
    return (await res.json()) as ClaimMissionResponse;
  } catch {
    return null;
  }
}
