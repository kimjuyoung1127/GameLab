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
      label: "Total Sessions",
      value: metrics.totalSessions,
      icon: FolderOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Files",
      value: metrics.totalFiles,
      icon: FileAudio,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Avg. Accuracy",
      value: `${metrics.avgAccuracy.toFixed(1)}%`,
      icon: Target,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Your Score",
      value: score.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-text">Overview</h1>
        </div>
        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Files</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {apiError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {apiError}
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((m) => (
            <div key={m.label} className="bg-panel rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  {m.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-text">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-panel rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text">Recent Sessions</h2>
              <button
                onClick={() => router.push("/sessions")}
                className="text-xs text-primary hover:text-primary-light transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
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
                  className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-panel-light cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileAudio className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{session.name}</p>
                      <p className="text-xs text-text-muted">
                        {session.id} &middot; {session.fileCount} files
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
                  No sessions yet. Upload files to create your first session.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-panel rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-text mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/upload")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio Files
                </button>
                <button
                  onClick={() => router.push("/sessions")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-panel-light text-text-secondary text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Go to Sessions
                </button>
                {activeSessions.length > 0 && (
                  <button
                    onClick={() => router.push(`/labeling/${activeSessions[0].id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface hover:bg-panel-light text-text-secondary text-sm font-medium transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    Continue Labeling
                  </button>
                )}
              </div>
            </div>

            <div className="bg-panel rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-text mb-4">Your Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Confirmed</span>
                  <span className="text-sm font-semibold text-accent">{totalConfirmed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Fixed</span>
                  <span className="text-sm font-semibold text-warning">{totalFixed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Active Sessions</span>
                  <span className="text-sm font-semibold text-primary">{activeSessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Completed</span>
                  <span className="text-sm font-semibold text-text">{completedSessions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
