"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { Lock, Trophy, UserCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useScoreStore, getLevel } from "@/lib/store/score-store";
import { useAchievementStore } from "@/lib/store/achievement-store";
import { useMissionStore } from "@/lib/store/mission-store";
import { useUIStore } from "@/lib/store/ui-store";

export default function ProfilePage() {
  const locale = useLocale();
  const { user } = useAuthStore();
  const { score, allTimeScore, streak, snapshot, refreshGamificationSnapshot } = useScoreStore();
  const { achievements, unlocked, load: loadAchievements, loaded } = useAchievementStore();
  const { daily, weekly, load: loadMissions, claim: claimMission, claimingIds } = useMissionStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    void refreshGamificationSnapshot();
    if (!loaded) void loadAchievements();
    void loadMissions();
  }, [loaded, loadAchievements, loadMissions, refreshGamificationSnapshot]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const level = getLevel(allTimeScore);

  return (
    <div className="min-h-screen bg-canvas text-text px-6 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="rounded-2xl border border-border bg-panel p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <UserCircle2 className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{displayName}</h1>
              <p className="text-xs text-text-muted">Level {level.level} · {locale === "ko" ? level.nameKo : level.name}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card title="Today Score" value={score.toLocaleString()} />
          <Card title="All-time Score" value={allTimeScore.toLocaleString()} />
          <Card title="Streak" value={`${streak} days`} />
          <Card title="Daily Progress" value={`${snapshot?.dailyProgress ?? 0}/${snapshot?.dailyGoal ?? 20}`} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-panel p-5">
            <h2 className="text-sm font-semibold mb-3">Missions</h2>
            <div className="space-y-2">
              {[...daily, ...weekly].slice(0, 8).map((mission) => {
                const claimable = mission.state === "Completed";
                const claiming = claimingIds.includes(mission.missionId);
                return (
                  <div key={mission.missionId} className="rounded-lg border border-border p-3 bg-surface">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{mission.title}</p>
                      <span className="text-[10px] text-text-muted">{mission.scope.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      {mission.progress}/{mission.target} · {mission.reward.points} pts · {mission.state}
                    </p>
                    <div className="h-1.5 bg-panel rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((mission.progress / Math.max(1, mission.target)) * 100, 100)}%` }} />
                    </div>
                    {claimable && (
                      <button
                        onClick={() => {
                          void (async () => {
                            const ok = await claimMission(mission.missionId);
                            if (ok) {
                              showToast("Mission reward claimed");
                              await refreshGamificationSnapshot();
                            }
                          })();
                        }}
                        disabled={claiming}
                        className="mt-2 px-3 py-1.5 text-xs rounded-md bg-primary text-white disabled:opacity-50"
                      >
                        {claiming ? "Claiming..." : "Claim Reward"}
                      </button>
                    )}
                  </div>
                );
              })}
              {daily.length + weekly.length === 0 && (
                <p className="text-xs text-text-muted">No missions found.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-panel p-5">
            <h2 className="text-sm font-semibold mb-3">My Badges</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((ach) => {
                const isUnlocked = unlocked.has(ach.id);
                const title = locale === "ko" ? ach.name_ko : ach.name;
                const desc = locale === "ko" ? ach.description_ko : ach.description;
                return (
                  <div key={ach.id} className={`rounded-lg border p-3 ${isUnlocked ? "bg-primary/10 border-primary/30" : "bg-surface border-border opacity-70"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isUnlocked ? <Trophy className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-text-muted" />}
                      <p className="text-xs font-semibold truncate">{title}</p>
                    </div>
                    <p className="text-[10px] text-text-muted line-clamp-2">{desc}</p>
                  </div>
                );
              })}
              {achievements.length === 0 && (
                <p className="text-xs text-text-muted col-span-full">No badges loaded.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {(snapshot?.recentEvents ?? []).slice(0, 10).map((ev) => (
              <div key={ev.id} className="rounded-md border border-border bg-surface px-3 py-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium">{ev.message}</p>
                  <p className="text-[10px] text-text-muted">{new Date(ev.occurredAt).toLocaleString()}</p>
                </div>
                <span className="text-xs font-semibold text-primary">{ev.points > 0 ? `+${ev.points}` : ev.points}</span>
              </div>
            ))}
            {(snapshot?.recentEvents?.length ?? 0) === 0 && (
              <p className="text-xs text-text-muted">No recent activity.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-4">
      <p className="text-[11px] text-text-muted">{title}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
