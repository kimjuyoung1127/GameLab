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
import { useSessionStore } from "@/lib/store/session-store";
import { endpoints } from "@/lib/api/endpoints";
import { useScoreStore } from "@/lib/store/score-store";
import type { Session, SessionStatus } from "@/types";

type FilterTab = "all" | "processing" | "completed";

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function statusColor(status: SessionStatus) {
  switch (status) {
    case "processing":
      return { dot: "bg-primary", text: "text-primary", label: "Processing" };
    case "completed":
      return { dot: "bg-accent", text: "text-accent", label: "Completed" };
    case "pending":
    default:
      return { dot: "bg-text-muted", text: "text-text-muted", label: "Pending" };
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

function progressBar(progress: number, status: SessionStatus) {
  const barColor = status === "completed" ? "bg-accent" : "bg-primary";
  const label =
    status === "processing"
      ? `Processing... ${progress}%`
      : status === "completed"
        ? `Complete ${progress}%`
        : `Waiting ${progress}%`;

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="w-full h-1.5 rounded-full bg-panel-light overflow-hidden">
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
  const router = useRouter();
  const { sessions, setSessions, setCurrentSession } = useSessionStore();
  const { score } = useScoreStore();

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
    <div className="flex flex-col h-screen">
      <header className="h-16 shrink-0 border-b border-border bg-panel flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-bold text-text">Sessions Management</h1>
          <p className="text-xs text-text-muted">Smart Spectro-Tagging &amp; Anomaly Detection</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {apiError && (
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {apiError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Today Score</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-text">{todayScore}%</span>
              </div>
              <p className="text-xs text-text-muted">Average completed-session score</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Processed Files</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text">{processedFiles.toLocaleString()}</span>
                <span className="text-sm text-text-muted">files</span>
              </div>
              <div className="w-32 h-1.5 rounded-full bg-panel-light overflow-hidden mt-1">
                <div className="h-full rounded-full bg-accent w-full" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Sessions</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-text">{activeCount}</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
              </div>
              <p className="text-xs text-text-muted">Current score: {score.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-panel rounded-lg p-1 border border-border">
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
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search Session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg bg-panel border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <button
              onClick={handleCreateSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-danger/5 border border-danger/20 rounded-lg px-4 py-2">
            <span className="text-sm text-text-secondary font-medium">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setDeleteSessionId("__bulk__")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Clear
            </button>
          </div>
        )}

        <div className="bg-panel rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Session ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Files</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Progress</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Score</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Created Date</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((session) => {
                  const sc = statusColor(session.status);
                  return (
                    <tr
                      key={session.id}
                      onClick={() => handleRowClick(session)}
                      className="hover:bg-panel-light/50 cursor-pointer transition-colors"
                    >
                      <td className="w-10 px-3 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(session.id)}
                          onChange={() => toggleSelect(session.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-text">{session.id}</p>
                          <p className="text-xs text-text-muted">{session.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">{session.fileCount} Files</td>
                      <td className="px-5 py-4">{progressBar(session.progress, session.status)}</td>
                      <td className="px-5 py-4">
                        {session.score !== null ? scoreBadge(session.score) : (
                          <span className="text-text-muted">&ndash;</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-text-secondary text-xs">{formatDate(session.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSessionId(session.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-danger/10 hover:text-danger transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-4 h-4 text-text-muted" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-text-muted">
                      No real sessions found yet. Upload files first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
            <p className="text-xs text-text-muted">Showing {filtered.length} results</p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:bg-panel-light transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:bg-panel-light transition-colors">
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-panel border border-border rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-sm font-bold text-text mb-2">
              {deleteSessionId === "__bulk__" ? `Delete ${selectedIds.size} Sessions?` : "Delete Session?"}
            </h3>
            <p className="text-xs text-text-muted mb-4">
              {deleteSessionId === "__bulk__"
                ? "This will permanently delete the selected sessions, all audio files, and all suggestions. This action cannot be undone."
                : "This will permanently delete the session, all audio files, and all suggestions. This action cannot be undone."}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteSessionId(null)}
                className="px-4 py-2 rounded-lg text-xs text-text-secondary hover:bg-panel-light"
              >
                Cancel
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
                className="px-4 py-2 rounded-lg bg-danger text-white text-xs font-bold disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
