"use client";

import { useState } from "react";
import { mockUsers } from "@/lib/mock/data";
import { useScoreStore } from "@/lib/store/score-store";
import {
  Trophy,
  Save,
  Download,
  ArrowRight,
  Bell,
  AudioLines,
  Check,
  X,
} from "lucide-react";

/* ───── role label helper ───── */
const roleLabelMap: Record<string, string> = {
  lead_analyst: "Lead Analyst",
  acoustic_eng: "Acoustic Eng.",
  data_analyst: "Data Analyst",
  junior_tagger: "Junior Tagger",
  contractor: "Contractor",
};

/* ───── accuracy SVG constants ───── */
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ACCURACY = 98.5;
const DASH = (ACCURACY / 100) * CIRCUMFERENCE;

/* ───── anomaly bar-chart mock data ───── */
const barData = [
  { hz: "0", normal: 28, confirmed: 18, anomaly: 4 },
  { hz: "2k", normal: 40, confirmed: 22, anomaly: 2 },
  { hz: "4k", normal: 55, confirmed: 30, anomaly: 6 },
  { hz: "6k", normal: 48, confirmed: 26, anomaly: 8 },
  { hz: "8k", normal: 60, confirmed: 35, anomaly: 12 },
  { hz: "10k", normal: 52, confirmed: 28, anomaly: 18 },
  { hz: "12k", normal: 42, confirmed: 20, anomaly: 14 },
  { hz: "14k", normal: 35, confirmed: 16, anomaly: 10 },
  { hz: "16k", normal: 24, confirmed: 12, anomaly: 6 },
  { hz: "18k", normal: 18, confirmed: 8, anomaly: 3 },
  { hz: "20k", normal: 10, confirmed: 4, anomaly: 1 },
];
const BAR_MAX = 65;

export default function LeaderboardPage() {
  const { totalConfirmed, totalFixed } = useScoreStore();
  const [activeTab, setActiveTab] = useState<"today" | "week" | "alltime">(
    "today"
  );

  const tabs = [
    { key: "today" as const, label: "Today" },
    { key: "week" as const, label: "This Week" },
    { key: "alltime" as const, label: "All Time" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      {/* ════════ TOP HEADER BAR ════════ */}
      <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0">
        {/* left – logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold text-text">
            Smart Spectro-Tagging
          </span>
          <span className="ml-1 text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            v2.4.0
          </span>
        </div>

        {/* right – bell + user */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-panel-light transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text leading-tight">
                Alex R.
              </p>
              <p className="text-[11px] text-text-muted leading-tight">
                Lead Analyst
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
              AR
            </div>
          </div>
        </div>
      </header>

      {/* ════════ BREADCRUMB + PAGE TITLE ════════ */}
      <div className="px-8 pt-5 pb-2 space-y-2 shrink-0">
        <p className="text-xs text-text-muted">
          <span className="hover:text-primary cursor-pointer">Sessions</span>
          <span className="mx-1.5">&gt;</span>
          <span className="text-text-secondary">Session #AUDIO-9921</span>
        </p>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">
            Session Completion Report
          </h1>
          <div className="flex items-center gap-2 text-text-muted text-xs font-medium tracking-wide uppercase">
            <span className="text-text-secondary">Duration</span>
            <span className="text-text font-bold text-sm">14m 20s</span>
          </div>
        </div>
      </div>

      {/* ════════ TWO-COLUMN BODY ════════ */}
      <div className="flex-1 px-8 pb-8 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ──────── LEFT COLUMN ──────── */}
        <div className="space-y-6">
          {/* ── Accuracy circle ── */}
          <div className="bg-panel rounded-2xl border border-border p-6 flex items-center gap-6">
            <div className="relative flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-text-muted mb-2">
                Accuracy
              </span>
              <svg
                width="170"
                height="170"
                viewBox="0 0 170 170"
                className="transform -rotate-90"
              >
                {/* track */}
                <circle
                  cx="85"
                  cy="85"
                  r={RADIUS}
                  fill="none"
                  stroke="#1F2937"
                  strokeWidth="12"
                />
                {/* value arc */}
                <circle
                  cx="85"
                  cy="85"
                  r={RADIUS}
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${DASH} ${CIRCUMFERENCE}`}
                />
              </svg>
              {/* centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-4">
                <span className="text-3xl font-extrabold text-text">
                  98.5%
                </span>
              </div>
              {/* delta */}
              <span className="mt-2 text-xs font-semibold text-accent">
                +2.4% vs avg
              </span>
            </div>

            {/* waveform icon */}
            <div className="flex flex-col items-center gap-1 opacity-40">
              <AudioLines className="w-10 h-10 text-accent" />
              <span className="text-[9px] text-text-muted uppercase tracking-widest">
                Audio
              </span>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="bg-panel rounded-2xl border border-border p-5 flex items-center divide-x divide-border-light">
            {/* Total Score */}
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Total Score
              </p>
              <p className="text-2xl font-extrabold text-primary">1,250</p>
            </div>
            {/* Samples */}
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Samples
              </p>
              <p className="text-2xl font-extrabold text-text">45</p>
            </div>
            {/* Speed */}
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">
                Speed
              </p>
              <p className="text-2xl font-extrabold text-text">
                3.1s{" "}
                <span className="text-sm font-normal text-text-muted">
                  /tag
                </span>
              </p>
            </div>
          </div>

          {/* ── Two cards (Confirmed / Anomalies) ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Confirmed Normal */}
            <div className="bg-panel rounded-2xl border border-accent/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-accent" />
                </div>
                <span className="text-xs font-bold text-accent">+840 pts</span>
              </div>
              <p className="text-xs text-text-muted">Confirmed Normal</p>
              <p className="text-4xl font-extrabold text-text">
                {totalConfirmed}
              </p>
              {/* progress bar */}
              <div className="w-full h-1.5 bg-accent/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${(totalConfirmed / 45) * 100}%` }}
                />
              </div>
            </div>

            {/* Anomalies Fixed */}
            <div className="bg-panel rounded-2xl border border-danger/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-danger/15 flex items-center justify-center">
                  <X className="w-5 h-5 text-danger" />
                </div>
                <span className="text-xs font-bold text-danger">+410 pts</span>
              </div>
              <p className="text-xs text-text-muted">Anomalies Fixed</p>
              <p className="text-4xl font-extrabold text-text">{totalFixed}</p>
              {/* progress bar */}
              <div className="w-full h-1.5 bg-danger/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger rounded-full"
                  style={{ width: `${(totalFixed / 45) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Anomaly Distribution chart ── */}
          <div className="bg-panel rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">
                Anomaly Distribution
              </h3>
              <button className="text-xs font-medium text-primary hover:underline">
                View Details
              </button>
            </div>

            {/* chart */}
            <div className="relative h-44">
              {/* Y grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="absolute left-0 right-0 border-t border-border-light/40"
                  style={{ bottom: `${pct}%` }}
                />
              ))}

              {/* bars */}
              <div className="relative h-full flex items-end justify-between gap-1 px-1">
                {barData.map((d) => {
                  const nH = (d.normal / BAR_MAX) * 100;
                  const cH = (d.confirmed / BAR_MAX) * 100;
                  const aH = (d.anomaly / BAR_MAX) * 100;
                  return (
                    <div
                      key={d.hz}
                      className="flex-1 flex items-end justify-center gap-[2px]"
                    >
                      <div
                        className="w-full max-w-[6px] rounded-t bg-primary"
                        style={{ height: `${nH}%` }}
                      />
                      <div
                        className="w-full max-w-[6px] rounded-t bg-accent"
                        style={{ height: `${cH}%` }}
                      />
                      <div
                        className="w-full max-w-[6px] rounded-t bg-danger"
                        style={{ height: `${aH}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-text-muted px-1">
              <span>0Hz</span>
              <span>10kHz</span>
              <span>20kHz</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
                Normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" />
                Confirmed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-danger inline-block" />
                Anomaly
              </span>
            </div>
          </div>
        </div>

        {/* ──────── RIGHT COLUMN ──────── */}
        <div className="space-y-6">
          {/* ── Top Taggers leaderboard ── */}
          <div className="bg-panel rounded-2xl border border-border p-6 space-y-5">
            {/* header */}
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-bold text-text">Top Taggers</h3>
            </div>

            {/* tabs */}
            <div className="flex gap-1 bg-surface rounded-lg p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                    activeTab === t.key
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-text-muted border-b border-border">
                    <th className="pb-2 pr-2 font-semibold">Rank</th>
                    <th className="pb-2 pr-2 font-semibold">User</th>
                    <th className="pb-2 pr-2 font-semibold text-right">
                      Today
                    </th>
                    <th className="pb-2 pr-2 font-semibold text-right">
                      Accuracy
                    </th>
                    <th className="pb-2 font-semibold text-right">All-Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user, i) => {
                    const isYou = user.id === "u-3";
                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border/50 transition-colors ${
                          isYou
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-panel-light"
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 pr-2">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                              i === 0
                                ? "bg-yellow-500/20 text-yellow-400"
                                : i === 1
                                ? "bg-gray-400/20 text-gray-300"
                                : i === 2
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-panel-light text-text-muted"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>

                        {/* User */}
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2.5">
                            {/* avatar */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                isYou ? "bg-orange-500" : "bg-primary-dark"
                              }`}
                            >
                              {user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p
                                className={`font-semibold leading-tight ${
                                  isYou ? "text-accent" : "text-text"
                                }`}
                              >
                                {isYou ? "You" : user.name}
                              </p>
                              <p className="text-[10px] text-text-muted leading-tight">
                                {roleLabelMap[user.role] ?? user.role}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Today */}
                        <td className="py-3 pr-2 text-right font-bold text-text tabular-nums">
                          {user.todayScore.toLocaleString()}
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 pr-2 text-right">
                          <span className="font-bold text-accent tabular-nums">
                            {user.accuracy.toFixed(1)}%
                          </span>
                        </td>

                        {/* All-Time */}
                        <td
                          className={`py-3 text-right font-bold tabular-nums ${
                            isYou ? "text-accent" : "text-text-secondary"
                          }`}
                        >
                          {user.allTimeScore.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* footer link */}
            <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1 pt-1">
              View Full Leaderboard
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ════════ BOTTOM ACTION BAR ════════ */}
      <div className="border-t border-border bg-panel px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-panel-light border border-border-light text-sm font-medium text-text hover:bg-surface transition-colors">
            <Save className="w-4 h-4" />
            Save Result
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-panel-light border border-border-light text-sm font-medium text-text hover:bg-surface transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-danger hover:bg-danger-dark text-sm font-bold text-white transition-colors">
          Back to Sessions
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
