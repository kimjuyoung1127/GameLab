/** 세션 목록 페이지: 필터(전체/처리중/완료), 검색, 삭제, 일괄 삭제. */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSessionStore } from "@/lib/store/session-store";
import { endpoints } from "@/lib/api/endpoints";
import { useScoreStore } from "@/lib/store/score-store";
import type { Session, SessionStatus } from "@/types";
import styles from "./styles/page.module.css";

type FilterTab = "all" | "processing" | "completed";

const TAB_LABELS: { key: FilterTab; tKey: string }[] = [
  { key: "all", tKey: "tabAll" },
  { key: "processing", tKey: "tabProcessing" },
  { key: "completed", tKey: "tabCompleted" },
];

function statusColor(status: SessionStatus) {
  switch (status) {
    case "processing":
      return { dot: "bg-primary", text: "text-primary", tKey: "statusProcessing" };
    case "completed":
      return { dot: "bg-accent", text: "text-accent", tKey: "statusCompleted" };
    case "pending":
    default:
      return { dot: "bg-text-muted", text: "text-text-muted", tKey: "statusPending" };
  }
}

function scoreBadge(score: number | null) {
  if (score === null) return null;
  let color = "bg-accent/15 text-accent";
  if (score < 40) color = "bg-danger/15 text-danger";
  else if (score < 80) color = "bg-warning/15 text-warning";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

function progressBar(progress: number, status: SessionStatus, t: (key: string, values?: Record<string, string | number | Date>) => string) {
  const barColor = status === "completed" ? "bg-accent" : "bg-primary";
  const label =
    status === "processing"
      ? t("progressProcessing", { progress })
      : status === "completed"
        ? t("progressCompleted", { progress })
        : t("progressPending", { progress });

  return (
    <div className={styles.c001}>
      <span className={styles.c002}>{label}</span>
      <div className={styles.c003}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SessionsPage() {
  const t = useTranslations("sessions");
  const router = useRouter();
  const { sessions, setSessions, setCurrentSession } = useSessionStore();
  const { score } = useScoreStore();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      try {
        setApiError(null);
        const res = await fetch(endpoints.sessions.list);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Session[];
        if (!cancelled) setSessions(data);
      } catch (err) {
        if (!cancelled) {
          setSessions([]);
          setApiError((err as Error).message || "Failed to load sessions");
        }
      }
    };
    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, [setSessions]);

  const filtered = sessions.filter((s) => {
    const matchTab = activeTab === "all" || s.status === activeTab;
    const matchSearch =
      searchQuery.trim() === "" ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });
  const processedFiles = sessions.reduce((sum, s) => sum + s.fileCount, 0);
  const activeCount = sessions.filter((s) => s.status === "processing").length;
  const completedScores = sessions
    .filter((s) => s.status === "completed" && s.score !== null)
    .map((s) => s.score as number);
  const todayScore = completedScores.length
    ? (completedScores.reduce((sum, v) => sum + v, 0) / completedScores.length).toFixed(1)
    : "0.0";

  function handleRowClick(session: Session) {
    setCurrentSession(session);
    router.push(`/labeling/${session.id}`);
  }

  function handleCreateSession() {
    router.push("/upload");
  }

  async function handleDeleteSession(sessionId: string) {
    setDeleting(true);
    try {
      const res = await fetch(endpoints.sessions.delete(sessionId), { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(sessionId); return n; });
    } catch (err) {
      setApiError((err as Error).message || "Failed to delete session");
    } finally {
      setDeleting(false);
      setDeleteSessionId(null);
    }
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const res = await fetch(endpoints.sessions.delete(id), { method: "DELETE" });
        if (!res.ok) throw new Error(`Failed to delete ${id}`);
      }
      setSessions(sessions.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    } catch (err) {
      setApiError((err as Error).message || "Bulk delete failed");
    } finally {
      setDeleting(false);
      setDeleteSessionId(null);
    }
  }

  function toggleSelect(sessionId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  }

  return (
    <div className={styles.c004}>
      <header className={styles.c005}>
        <div>
          <h1 className={styles.c006}>{t("title")}</h1>
          <p className={styles.c007}>{t("subtitle")}</p>
        </div>
      </header>

      <div className={styles.c008}>
        {apiError && (
          <div className={styles.c009}>
            {apiError}
          </div>
        )}
        <div className={styles.c010}>
          <div className={styles.c011}>
            <div className={styles.c012}>
              <p className={styles.c013}>{t("todayScore")}</p>
              <div className={styles.c014}>
                <span className={styles.c015}>{todayScore}%</span>
              </div>
              <p className={styles.c007}>{t("todayScoreHint")}</p>
            </div>
            <div className={styles.c016}>
              <Shield className={styles.c017} />
            </div>
          </div>

          <div className={styles.c011}>
            <div className={styles.c012}>
              <p className={styles.c013}>{t("processedFiles")}</p>
              <div className={styles.c018}>
                <span className={styles.c015}>{processedFiles.toLocaleString()}</span>
                <span className={styles.c019}>{t("filesUnit")}</span>
              </div>
              <div className={styles.c020}>
                <div className={styles.c021} />
              </div>
            </div>
            <div className={styles.c016}>
              <FileText className={styles.c017} />
            </div>
          </div>

          <div className={styles.c011}>
            <div className={styles.c012}>
              <p className={styles.c013}>{t("activeSessions")}</p>
              <div className={styles.c022}>
                <span className={styles.c015}>{activeCount}</span>
                <span className={styles.c023}>
                  <span className={styles.c024} />
                  <span className={styles.c025} />
                </span>
              </div>
              <p className={styles.c007}>{t("activeSessionsHint", { score: score.toLocaleString() })}</p>
            </div>
            <div className={styles.c016}>
              <Settings className={styles.c017} />
            </div>
          </div>
        </div>

        <div className={styles.c026}>
          <div className={styles.c027}>
            {TAB_LABELS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text hover:bg-panel-light"
                }`}
              >
                {t(tab.tKey)}
              </button>
            ))}
          </div>

          <div className={styles.c028}>
            <div className={styles.c029}>
              <Search className={styles.c030} />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.c031}
              />
            </div>

            <button
              onClick={handleCreateSession}
              className={styles.c032}
            >
              <Plus className={styles.c033} />
              {t("uploadFiles")}
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className={styles.c034}>
            <span className={styles.c035}>
              {t("selectedCount", { count: selectedIds.size })}
            </span>
            <button
              onClick={() => setDeleteSessionId("__bulk__")}
              className={styles.c036}
            >
              <Trash2 className={styles.c037} />
              {t("deleteSelected")}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className={styles.c038}
            >
              {t("clear")}
            </button>
          </div>
        )}

        <div className={styles.c039}>
          <div className={styles.c040}>
            <table className={styles.c041}>
              <thead>
                <tr className={styles.c042}>
                  <th className={styles.c043}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className={styles.c044}
                    />
                  </th>
                  <th className={styles.c045}>{t("sessionId")}</th>
                  <th className={styles.c045}>{t("filesHeader")}</th>
                  <th className={styles.c045}>{t("progress")}</th>
                  <th className={styles.c045}>{t("score")}</th>
                  <th className={styles.c045}>{t("status")}</th>
                  <th className={styles.c045}>{t("createdDate")}</th>
                  <th className={styles.c046}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody className={styles.c047}>
                {filtered.map((session) => {
                  const sc = statusColor(session.status);
                  return (
                    <tr
                      key={session.id}
                      onClick={() => handleRowClick(session)}
                      className={styles.c048}
                    >
                      <td className={styles.c049} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(session.id)}
                          onChange={() => toggleSelect(session.id)}
                          className={styles.c044}
                        />
                      </td>
                      <td className={styles.c050}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className={styles.c051}>{session.id}</p>
                            {session.userId && session.userId === currentUserId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary-light">
                                {t("mySession")}
                              </span>
                            )}
                          </div>
                          <p className={styles.c007}>{session.name}</p>
                        </div>
                      </td>
                      <td className={styles.c052}>{session.fileCount} {t("filesSuffix")}</td>
                      <td className={styles.c050}>{progressBar(session.progress, session.status, t)}</td>
                      <td className={styles.c050}>
                        {session.score !== null ? scoreBadge(session.score) : (
                          <span className={styles.c053}>&ndash;</span>
                        )}
                      </td>
                      <td className={styles.c050}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          {t(sc.tKey)}
                        </span>
                      </td>
                      <td className={styles.c054}>{formatDate(session.createdAt)}</td>
                      <td className={styles.c055}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSessionId(session.id);
                          }}
                          className={styles.c056}
                          title={t("deleteTitle")}
                        >
                          <Trash2 className={styles.c057} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className={styles.c058}>
                      {t("emptyState")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.c059}>
            <p className={styles.c007}>{t("showingResults", { count: filtered.length })}</p>
            <div className={styles.c022}>
              <button className={styles.c060}>
                <ChevronLeft className={styles.c037} />
                {t("previous")}
              </button>
              <button className={styles.c060}>
                {t("next")}
                <ChevronRight className={styles.c037} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteSessionId && (
        <div className={styles.c061}>
          <div className={styles.c062}>
            <h3 className={styles.c063}>
              {deleteSessionId === "__bulk__" ? t("deleteModalBulk", { count: selectedIds.size }) : t("deleteModalSingle")}
            </h3>
            <p className={styles.c064}>
              {deleteSessionId === "__bulk__"
                ? t("deleteConfirmBulk")
                : t("deleteConfirmSingle")}
            </p>
            <div className={styles.c065}>
              <button
                onClick={() => setDeleteSessionId(null)}
                className={styles.c066}
              >
                {t("deleteCancel")}
              </button>
              <button
                onClick={() => {
                  if (deleteSessionId === "__bulk__") {
                    void handleBulkDelete();
                  } else {
                    void handleDeleteSession(deleteSessionId);
                  }
                }}
                disabled={deleting}
                className={styles.c067}
              >
                {deleting ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
