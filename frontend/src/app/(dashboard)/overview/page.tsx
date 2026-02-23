/** 대시보드 개요 페이지: 4카드 메트릭스, 최근 세션, 빠른 액션, 활동 요약. */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  FileAudio,
  FolderOpen,
  Plus,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useScoreStore } from "@/lib/store/score-store";
import { endpoints } from "@/lib/api/endpoints";
import type { OverviewMetrics, Session } from "@/types";
import { useTranslations } from "next-intl";
import styles from "./styles/page.module.css";

const EMPTY_METRICS: OverviewMetrics = {
  totalSessions: 0,
  totalFiles: 0,
  filesProcessed: 0,
  avgAccuracy: 0,
  recentUploads: 0,
  activeSessions: 0,
};

export default function OverviewPage() {
  const router = useRouter();
  const t = useTranslations("overview");
  const { score, totalConfirmed, totalFixed } = useScoreStore();
  const [metrics, setMetrics] = useState<OverviewMetrics>(EMPTY_METRICS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setApiError(null);
        const [metricsRes, sessionsRes] = await Promise.all([
          fetch(endpoints.overview.metrics),
          fetch(endpoints.sessions.list),
        ]);

        if (!cancelled) {
          if (!metricsRes.ok || !sessionsRes.ok) {
            throw new Error("Failed to load overview data");
          }
          setMetrics((await metricsRes.json()) as OverviewMetrics);
          setSessions((await sessionsRes.json()) as Session[]);
        }
      } catch (err) {
        if (!cancelled) {
          setMetrics(EMPTY_METRICS);
          setSessions([]);
          setApiError((err as Error).message || "Server error");
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions]
  );
  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === "processing"),
    [sessions]
  );

  const cards = [
    {
      label: t("totalSessions"),
      value: metrics.totalSessions,
      icon: FolderOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("totalFiles"),
      value: metrics.totalFiles,
      icon: FileAudio,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: t("avgAccuracy"),
      value: `${metrics.avgAccuracy.toFixed(1)}%`,
      icon: Target,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: t("yourScore"),
      value: score.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className={styles.c001}>
      <header className={styles.c002}>
        <div className={styles.c003}>
          <BarChart3 className={styles.c004} />
          <h1 className={styles.c005}>{t("title")}</h1>
        </div>
        <button
          onClick={() => router.push("/upload")}
          className={styles.c006}
        >
          <Upload className={styles.c007} />
          <span className={styles.c008}>{t("uploadFiles")}</span>
        </button>
      </header>

      <div className={styles.c009}>
        {apiError && (
          <div className={styles.c010}>
            {apiError}
          </div>
        )}
        <div className={styles.c011}>
          {cards.map((m) => (
            <div key={m.label} className={styles.c012}>
              <div className={styles.c013}>
                <span className={styles.c014}>
                  {m.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className={styles.c015}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.c016}>
          <div className={styles.c017}>
            <div className={styles.c018}>
              <h2 className={styles.c019}>{t("recentSessions")}</h2>
              <button
                onClick={() => router.push("/sessions")}
                className={styles.c020}
              >
                {t("viewAll")}
              </button>
            </div>

            <div className={styles.c021}>
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    if (session.status === "processing") {
                      router.push(`/labeling/${session.id}`);
                    } else {
                      router.push("/sessions");
                    }
                  }}
                  className={styles.c022}
                >
                  <div className={styles.c023}>
                    <div className={styles.c024}>
                      <FileAudio className={styles.c025} />
                    </div>
                    <div className={styles.c026}>
                      <p className={styles.c027}>{session.name}</p>
                      <p className={styles.c028}>
                        {session.id} &middot; {session.fileCount} {t("fileUnit")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className={styles.c029}>
                  {t("emptySessions")}
                </div>
              )}
            </div>
          </div>

          <div className={styles.c030}>
            <div className={styles.c031}>
              <h2 className={styles.c032}>{t("quickActions")}</h2>
              <div className={styles.c033}>
                <button
                  onClick={() => router.push("/upload")}
                  className={styles.c034}
                >
                  <Upload className={styles.c007} />
                  {t("uploadAudio")}
                </button>
                <button
                  onClick={() => router.push("/sessions")}
                  className={styles.c035}
                >
                  <Plus className={styles.c007} />
                  {t("goToSessions")}
                </button>
                {activeSessions.length > 0 && (
                  <button
                    onClick={() => router.push(`/labeling/${activeSessions[0].id}`)}
                    className={styles.c035}
                  >
                    <Activity className={styles.c007} />
                    {t("continueLabeling")}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.c031}>
              <h2 className={styles.c032}>{t("yourActivity")}</h2>
              <div className={styles.c021}>
                <div className={styles.c036}>
                  <span className={styles.c028}>{t("confirmed")}</span>
                  <span className={styles.c037}>{totalConfirmed}</span>
                </div>
                <div className={styles.c036}>
                  <span className={styles.c028}>{t("fixed")}</span>
                  <span className={styles.c038}>{totalFixed}</span>
                </div>
                <div className={styles.c036}>
                  <span className={styles.c028}>{t("activeSessions")}</span>
                  <span className={styles.c039}>{activeSessions.length}</span>
                </div>
                <div className={styles.c036}>
                  <span className={styles.c028}>{t("completed")}</span>
                  <span className={styles.c019}>{completedSessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
