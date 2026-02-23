/** 대시보드 셸: 사이드바 + TopBar + 메인 콘텐츠 3패널 레이아웃, 모바일 햄버거, 레벨업 토스트. */
"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import HotkeyHelp from "./HotkeyHelp";
import UnsavedModal from "./UnsavedModal";
import Toast from "../ui/Toast";
import { useScoreStore, getLevel } from "@/lib/store/score-store";
import { useUIStore } from "@/lib/store/ui-store";

const NAV_ROUTES: Record<string, string> = {
  "1": "/overview",
  "2": "/upload",
  "3": "/sessions",
  "4": "/leaderboard",
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const t = useTranslations("layout");
  const tSidebar = useTranslations("sidebar");
  const locale = useLocale();
  const { allTimeScore } = useScoreStore();
  const { showToast } = useUIStore();
  const prevLevelRef = useRef<number | null>(null);

  /* ----- Level-up toast detection ----- */
  useEffect(() => {
    const currentLevel = getLevel(allTimeScore).level;
    if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
      const info = getLevel(allTimeScore);
      const name = locale === "ko" ? info.nameKo : info.name;
      showToast(tSidebar("levelUp", { level: info.level, name }));
    }
    prevLevelRef.current = currentLevel;
  }, [allTimeScore, locale, showToast, tSidebar]);

  /* ----- Global navigation shortcuts (Alt+1~4) ----- */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const route = NAV_ROUTES[e.key];
      if (route) {
        e.preventDefault();
        router.push(route);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-panel border border-border md:hidden"
        aria-label={t("openMenu")}
      >
        <Menu className="w-5 h-5 text-text" />
      </button>

      {/* Sidebar — always visible on md+, overlay on mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative">
          <Sidebar activePath={mounted ? pathname : ""} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-panel-light md:hidden"
            aria-label={t("closeMenu")}
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      <main className="flex-1 min-w-0">{children}</main>

      <HotkeyHelp />
      <UnsavedModal />
      <Toast />
    </div>
  );
}
