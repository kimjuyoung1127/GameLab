"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useSessionStore } from "@/lib/store/session-store";
import type { Session, SessionStatus } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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
  let color = "bg-accent/15 text-accent"; // green >80
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

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default function SessionsPage() {
  const router = useRouter();
  const { sessions, setCurrentSession, createSession } = useSessionStore();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  /* filtering */
  const filtered = sessions.filter((s) => {
    const matchTab = activeTab === "all" || s.status === activeTab;
    const matchSearch =
      searchQuery.trim() === "" ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  /* row click handler */
  function handleRowClick(session: Session) {
    setCurrentSession(session);
    router.push(`/labeling/${session.id}`);
  }

  function handleCreateSession() {
    const newSession = createSession({
      name: `New Session ${sessions.length + 1}`,
    });
    router.push(`/labeling/${newSession.id}`);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-screen">
      {/* ---- Top Bar (local page header) ---- */}
      <header className="h-16 shrink-0 border-b border-border bg-panel flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-bold text-text">Sessions Management</h1>
          <p className="text-xs text-text-muted">Smart Spectro-Tagging &amp; Anomaly Detection</p>
        </div>
      </header>

      {/* ---- Scrollable content ---- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* =========== STATS CARDS =========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 - Today Score */}
          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Today Score</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-text">94%</span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-accent mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +2.4%
                </span>
              </div>
              <p className="text-xs text-text-muted">Avg. anomaly detection rate</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Card 2 - Processed Files */}
          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Processed Files</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text">1,240</span>
                <span className="text-sm text-text-muted">files</span>
              </div>
              {/* mini progress bar */}
              <div className="w-32 h-1.5 rounded-full bg-panel-light overflow-hidden mt-1">
                <div className="h-full rounded-full bg-accent w-3/4" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Card 3 - Active Sessions */}
          <div className="bg-panel rounded-xl border border-border p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Active Sessions</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-text">8</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                </span>
              </div>
              <p className="text-xs text-text-muted">Currently processing audio streams</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* =========== FILTER BAR =========== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs */}
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
            {/* Search */}
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

            {/* Create Session */}
            <button
              onClick={handleCreateSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          </div>
        </div>

        {/* =========== TABLE =========== */}
        <div className="bg-panel rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Session ID
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Files
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
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
                      {/* Session ID + Name */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-text">{session.id}</p>
                          <p className="text-xs text-text-muted">{session.name}</p>
                        </div>
                      </td>

                      {/* Files */}
                      <td className="px-5 py-4 text-text-secondary">
                        {session.fileCount} Files
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-4">
                        {progressBar(session.progress, session.status)}
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        {session.score !== null ? scoreBadge(session.score) : (
                          <span className="text-text-muted">&ndash;</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                          <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-text-secondary text-xs">
                        {formatDate(session.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1.5 rounded-md hover:bg-panel-light transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-text-muted" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-text-muted">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ---- Footer / Pagination ---- */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3.5 border-t border-border">
            <p className="text-xs text-text-muted">
              Showing 1 to {filtered.length} of 128 results
            </p>
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
    </div>
  );
}
