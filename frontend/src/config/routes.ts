/** Managed route registry for docs/code integrity automation. */
import { LayoutDashboard, Upload, List, Trophy, LucideIcon } from "lucide-react";

export type ManagedRoute = {
  key: string;
  href: string;
  group: string;
  nav: boolean;
};

export type NavRoute = ManagedRoute & {
  icon: LucideIcon;
};

export const MANAGED_ROUTES: ManagedRoute[] = [
  { key: "login", href: "/login", group: "auth", nav: false },
  { key: "overview", href: "/overview", group: "dashboard", nav: true },
  { key: "upload", href: "/upload", group: "dashboard", nav: true },
  { key: "sessions", href: "/sessions", group: "dashboard", nav: true },
  { key: "leaderboard", href: "/leaderboard", group: "dashboard", nav: true },
  { key: "labeling", href: "/labeling/[id]", group: "labeling", nav: false },
];

export const NAV_ROUTES: NavRoute[] = [
  { key: "overview", href: "/overview", group: "dashboard", nav: true, icon: LayoutDashboard },
  { key: "upload", href: "/upload", group: "dashboard", nav: true, icon: Upload },
  { key: "sessions", href: "/sessions", group: "dashboard", nav: true, icon: List },
  { key: "leaderboard", href: "/leaderboard", group: "dashboard", nav: true, icon: Trophy },
];

export const HOTKEY_ROUTES: Record<string, string> = {
  "1": "/overview",
  "2": "/upload",
  "3": "/sessions",
  "4": "/leaderboard",
};
