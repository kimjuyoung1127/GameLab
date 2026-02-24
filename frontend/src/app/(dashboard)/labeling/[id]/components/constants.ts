/** Labeling UI constants: tool metadata and suggestion status display mapping. */
import type { LucideIcon } from "lucide-react";
import { MousePointer2, Pencil, Anchor, Square, ZoomIn, ZoomOut } from "lucide-react";
import type { DrawTool, SuggestionStatus } from "@/types";

export const MAX_FREQ = 20_000;

export const tools: { id: DrawTool; icon: LucideIcon; label: string; hotkey: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select", hotkey: "A" },
  { id: "brush", icon: Pencil, label: "Brush", hotkey: "B" },
  { id: "anchor", icon: Anchor, label: "Anchor", hotkey: "G" },
  { id: "box", icon: Square, label: "Box", hotkey: "R" },
];

export const zoomTools: { id: "zoom-in" | "zoom-out"; icon: LucideIcon; label: string }[] = [
  { id: "zoom-in", icon: ZoomIn, label: "Zoom In" },
  { id: "zoom-out", icon: ZoomOut, label: "Zoom Out" },
];

export const statusColors: Record<
  SuggestionStatus,
  { border: string; bg: string; tagBg: string; label: string; dashed: boolean }
> = {
  pending: { border: "border-orange-400", bg: "bg-orange-400", tagBg: "bg-orange-400/90", label: "text-orange-400", dashed: true },
  confirmed: { border: "border-accent", bg: "bg-accent", tagBg: "bg-accent/90", label: "text-accent", dashed: false },
  rejected: { border: "border-danger", bg: "bg-danger", tagBg: "bg-danger/90", label: "text-danger", dashed: true },
  corrected: { border: "border-cyan-400", bg: "bg-cyan-400", tagBg: "bg-cyan-400/90", label: "text-cyan-400", dashed: false },
};
