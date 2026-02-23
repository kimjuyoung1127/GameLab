/** 리더보드 페이지: 사용자 랭킹 테이블 (오늘/정확도/누적 점수). */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import type { User } from "@/types";
import { endpoints } from "@/lib/api/endpoints";

export default function LeaderboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setApiError(null);
        const res = await fetch(endpoints.leaderboard);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as User[];
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) {
          setUsers([]);
          setApiError((err as Error).message || "Failed to load leaderboard");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/overview")}
            className="p-1.5 rounded-lg hover:bg-panel-light transition-colors"
            aria-label="Back to overview"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-text">Leaderboard</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {apiError && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {apiError}
          </div>
        )}
        <div className="bg-panel rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Rank</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Today</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Accuracy</th>
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">All-Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-panel-light transition-colors">
                  <td className="px-5 py-3 text-text-secondary">{index + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-text">{user.name}</div>
                    <div className="text-xs text-text-muted">{user.role}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-text">
                    {user.todayScore.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-accent">{user.accuracy.toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {user.allTimeScore.toLocaleString()}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-text-muted">
                    No leaderboard data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
