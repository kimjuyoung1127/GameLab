import { create } from "zustand";
import { claimMission, fetchMissions } from "@/lib/api/gamification";
import type { MissionItem } from "@/types/gamification";

type MissionState = {
  daily: MissionItem[];
  weekly: MissionItem[];
  loading: boolean;
  claimingIds: string[];
  load: () => Promise<void>;
  claim: (missionId: string) => Promise<boolean>;
};

export const useMissionStore = create<MissionState>((set, get) => ({
  daily: [],
  weekly: [],
  loading: false,
  claimingIds: [],

  load: async () => {
    set({ loading: true });
    try {
      const data = await fetchMissions();
      set({ daily: data.daily, weekly: data.weekly });
    } finally {
      set({ loading: false });
    }
  },

  claim: async (missionId: string) => {
    if (get().claimingIds.includes(missionId)) return false;
    set((s) => ({ claimingIds: [...s.claimingIds, missionId] }));
    try {
      const result = await claimMission(missionId);
      await get().load();
      return !!result && result.state === "Claimed";
    } finally {
      set((s) => ({ claimingIds: s.claimingIds.filter((id) => id !== missionId) }));
    }
  },
}));
