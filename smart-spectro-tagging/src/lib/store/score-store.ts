import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScoreState {
  score: number;
  streak: number;
  totalConfirmed: number;
  totalFixed: number;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addConfirm: () => void;
  addFix: () => void;
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set) => ({
      score: 9420,
      streak: 12,
      totalConfirmed: 42,
      totalFixed: 3,

      addScore: (points) => set((s) => ({ score: s.score + points })),
      incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
      addConfirm: () => set((s) => ({ totalConfirmed: s.totalConfirmed + 1 })),
      addFix: () => set((s) => ({ totalFixed: s.totalFixed + 1 })),
    }),
    {
      name: "sst-score",
      version: 1,
      partialize: (state) => ({
        score: state.score,
        streak: state.streak,
        totalConfirmed: state.totalConfirmed,
        totalFixed: state.totalFixed,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          // v0 → v1: ensure totalConfirmed/totalFixed exist
          const old = persisted as Record<string, unknown>;
          return {
            score: (old.score as number) ?? 9420,
            streak: (old.streak as number) ?? 12,
            totalConfirmed: (old.totalConfirmed as number) ?? 42,
            totalFixed: (old.totalFixed as number) ?? 3,
          };
        }
        return persisted as ScoreState;
      },
    }
  )
);
