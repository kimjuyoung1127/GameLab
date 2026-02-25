/** Local constants for tool metadata and status/bookmark colors used by labeling components. */
import type { LucideIcon } from "lucide-react";
import { Anchor, MousePointer2, Square, ZoomIn, ZoomOut } from "lucide-react";
import type { BookmarkType, DrawTool, SuggestionStatus } from "@/types";

export const MAX_FREQ = 20_000;

export const tools: { id: DrawTool; icon: LucideIcon; labelKey: string; hotkey: string }[] = [
  { id: "select", icon: MousePointer2, labelKey: "toolSelect", hotkey: "A" },
  { id: "anchor", icon: Anchor, labelKey: "toolAnchor", hotkey: "G" },
  { id: "box", icon: Square, labelKey: "toolBox", hotkey: "R" },
];

export const zoomTools: { id: "zoom-in" | "zoom-out"; icon: LucideIcon; labelKey: string }[] = [
  { id: "zoom-in", icon: ZoomIn, labelKey: "zoomIn" },
  { id: "zoom-out", icon: ZoomOut, labelKey: "zoomOut" },
];

export const bookmarkColors: Record<
  BookmarkType,
  { dot: string; line: string; flag: string; postIt: string }
> = {
  recheck:        { dot: "bg-blue-400",   line: "bg-blue-400/60",   flag: "text-blue-400",   postIt: "bg-blue-900/80 border-blue-600" },
  noise_suspect:  { dot: "bg-red-400",    line: "bg-red-400/60",    flag: "text-red-400",    postIt: "bg-red-900/80 border-red-600" },
  edge_case:      { dot: "bg-purple-400", line: "bg-purple-400/60", flag: "text-purple-400", postIt: "bg-purple-900/80 border-purple-600" },
  needs_analysis: { dot: "bg-amber-400",  line: "bg-amber-400/60",  flag: "text-amber-400",  postIt: "bg-amber-900/80 border-amber-600" },
};

export const statusColors: Record<
  SuggestionStatus,
  { border: string; bg: string; tagBg: string; label: string; dashed: boolean }
> = {
  pending: { border: "border-orange-400", bg: "bg-orange-400", tagBg: "bg-orange-400/90", label: "text-orange-400", dashed: true },
  confirmed: { border: "border-accent", bg: "bg-accent", tagBg: "bg-accent/90", label: "text-accent", dashed: false },
  rejected: { border: "border-danger", bg: "bg-danger", tagBg: "bg-danger/90", label: "text-danger", dashed: true },
  corrected: { border: "border-cyan-400", bg: "bg-cyan-400", tagBg: "bg-cyan-400/90", label: "text-cyan-400", dashed: false },
};
