/** 점수/게이미피케이션 상태: 서버 동기화 + 낙관적 업데이트. persist 미들웨어. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMyScore } from "@/lib/api/leaderboard";

interface ScoreState {
  score: number;
  streak: number;
  totalConfirmed: number;
  totalFixed: number;
  serverSynced: boolean;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addConfirm: () => void;
  addFix: () => void;
  fetchFromServer: () => Promise<void>;
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set) => ({
      score: 0,
      streak: 0,
      totalConfirmed: 0,
      totalFixed: 0,
      serverSynced: false,

      addScore: (points) => set((s) => ({ score: s.score + points })),
      incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
      addConfirm: () => set((s) => ({ totalConfirmed: s.totalConfirmed + 1 })),
      addFix: () => set((s) => ({ totalFixed: s.totalFixed + 1 })),

      fetchFromServer: async () => {
        const data = await fetchMyScore();
        if (data) {
          set({ score: data.todayScore, serverSynced: true });
        }
      },
    }),
    {
      name: "sst-score",
      version: 2,
      partialize: (state) => ({
        score: state.score,
        streak: state.streak,
        totalConfirmed: state.totalConfirmed,
        totalFixed: state.totalFixed,
      }),
      migrate: () => ({
        score: 0,
        streak: 0,
        totalConfirmed: 0,
        totalFixed: 0,
      }),
    }
  )
);
