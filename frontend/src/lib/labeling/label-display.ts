export type LabelDisplay = {
  displayCode: string;
  displayName: string;
  tooltip: string;
};

export type TagPlacement = "top-left" | "top-right" | "inside-top-left" | "inside-top-right";

export type TagPlacementStyle = {
  placement: TagPlacement;
  className: string;
};

const DISPLAY_NAME_MAP: Record<string, { code: string; name: string }> = {
  "startup surge detection": { code: "SU-DET", name: "Startup Surge Detection" },
  "startup surge dete": { code: "SU-DET", name: "Startup Surge Detection" },
  "bearing fault": { code: "BRG-FAULT", name: "Bearing Fault" },
  "cavitation": { code: "CAV", name: "Cavitation" },
  "harmonic noise": { code: "HRM-NOISE", name: "Harmonic Noise" },
};

function normalize(rawLabel: string): string {
  return rawLabel.trim().toLowerCase().replace(/\s+/g, " ");
}

function toTitleCase(raw: string): string {
  return raw
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildFallbackCode(rawLabel: string): string {
  const cleaned = rawLabel
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "AI-LABEL";

  const words = cleaned.split(" ").filter(Boolean);
  const initials = words.map((w) => w.charAt(0)).join("");
  const digitToken = words.find((w) => /\d/.test(w)) ?? "";
  const base = `${initials}${digitToken}`.replace(/[^A-Z0-9]/g, "");
  return (base || cleaned.slice(0, 10)).slice(0, 10);
}

export function getLabelDisplay(rawLabel: string, description?: string | null): LabelDisplay {
  const normalized = normalize(rawLabel);
  const mapped = DISPLAY_NAME_MAP[normalized];
  const displayCode = (mapped?.code ?? buildFallbackCode(rawLabel)).slice(0, 10);
  const displayName = mapped?.name ?? toTitleCase(rawLabel);
  const descriptionPart = description?.trim() ? ` | ${description.trim()}` : "";
  const tooltip = `${displayName} (raw: ${rawLabel})${descriptionPart}`;
  return { displayCode, displayName, tooltip };
}

export function getTagPlacementStyle(params: {
  leftPct: number;
  widthPct: number;
  topPct: number;
  heightPct: number;
}): TagPlacementStyle {
  const nearBottom = params.topPct > 82 || params.topPct + params.heightPct > 92;
  const nearRight = params.leftPct + params.widthPct > 85;

  if (nearBottom && nearRight) {
    return { placement: "inside-top-right", className: "top-1 right-1" };
  }
  if (nearBottom) {
    return { placement: "inside-top-left", className: "top-1 left-1" };
  }
  if (nearRight) {
    return { placement: "top-right", className: "-top-5 right-0" };
  }
  return { placement: "top-left", className: "-top-5 left-0" };
}
