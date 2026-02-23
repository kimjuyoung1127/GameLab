/** 리더보드 페이지: 사용자 랭킹 테이블 (오늘/정확도/누적 점수). */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import type { User } from "@/types";
import { endpoints } from "@/lib/api/endpoints";
import { useAchievementStore } from "@/lib/store/achievement-store";
import styles from "./styles/page.module.css";

export default function LeaderboardPage() {
  const router = useRouter();
  const t = useTranslations("leaderboard");
  const locale = useLocale();
  const { achievements, unlocked, load: loadAchievements, loaded } = useAchievementStore();
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

  useEffect(() => {
    if (!loaded) void loadAchievements();
  }, [loaded, loadAchievements]);

  return (
    <div className={styles.c001}>
      <header className={styles.c002}>
        <div className={styles.c003}>
          <button
            onClick={() => router.push("/overview")}
            className={styles.c004}
            aria-label={t("backAria")}
          >
            <ArrowLeft className={styles.c005} />
          </button>
          <Trophy className={styles.c006} />
          <h1 className={styles.c007}>{t("title")}</h1>
        </div>
      </header>

      <div className={styles.c008}>
        {apiError && (
          <div className={styles.c009}>
            {apiError}
          </div>
        )}
        <div className={styles.c010}>
          <table className={styles.c011}>
            <thead>
              <tr className={styles.c012}>
                <th className={styles.c013}>{t("rank")}</th>
                <th className={styles.c013}>{t("user")}</th>
                <th className={styles.c014}>{t("today")}</th>
                <th className={styles.c014}>{t("accuracy")}</th>
                <th className={styles.c014}>{t("allTime")}</th>
              </tr>
            </thead>
            <tbody className={styles.c015}>
              {users.map((user, index) => (
                <tr key={user.id} className={styles.c016}>
                  <td className={styles.c017}>{index + 1}</td>
                  <td className={styles.c018}>
                    <div className={styles.c019}>{user.name}</div>
                    <div className={styles.c020}>{user.role}</div>
                  </td>
                  <td className={styles.c021}>
                    {user.todayScore.toLocaleString()}
                  </td>
                  <td className={styles.c022}>{user.accuracy.toFixed(1)}%</td>
                  <td className={styles.c023}>
                    {user.allTimeScore.toLocaleString()}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.c024}>
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Achievement Badge Grid */}
        {achievements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-text mb-4">{t("myAchievements")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {achievements.map((ach) => {
                const isUnlocked = unlocked.has(ach.id);
                const name = locale === "ko" ? ach.name_ko : ach.name;
                const desc = locale === "ko" ? ach.description_ko : ach.description;
                return (
                  <div
                    key={ach.id}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      isUnlocked
                        ? "bg-primary/10 border-primary/30"
                        : "bg-surface/50 border-border opacity-50"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                      isUnlocked ? "bg-primary/20" : "bg-surface"
                    }`}>
                      {isUnlocked ? (
                        <Trophy className="w-5 h-5 text-primary" />
                      ) : (
                        <Lock className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold mb-0.5 ${isUnlocked ? "text-text" : "text-text-muted"}`}>
                      {name}
                    </p>
                    <p className="text-[10px] text-text-muted">{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
