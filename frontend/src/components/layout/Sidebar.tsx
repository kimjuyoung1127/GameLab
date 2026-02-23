/** 좌측 사이드바: 네비게이션 링크, 유저 정보, 단축키, 언어전환, 레벨 표시, auth-store 연동. */
"use client";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AudioLines, Keyboard, LayoutDashboard, List, Trophy, Upload } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useScoreStore, getLevel } from "@/lib/store/score-store";
import LocaleSwitcher from "./LocaleSwitcher";

const navConfig = [
  { key: "overview" as const, href: "/overview", icon: LayoutDashboard },
  { key: "upload" as const, href: "/upload", icon: Upload },
  { key: "sessions" as const, href: "/sessions", icon: List },
  { key: "leaderboard" as const, href: "/leaderboard", icon: Trophy },
];

export default function Sidebar({ activePath = "/" }: { activePath?: string }) {
  const { user } = useAuthStore();
  const { toggleHotkeyHelp } = useUIStore();
  const { allTimeScore } = useScoreStore();
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const levelInfo = getLevel(allTimeScore);
  const levelName = locale === "ko" ? levelInfo.nameKo : levelInfo.name;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayRole = t("userRole");
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-60 bg-panel border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <Link href="/overview" className="p-5 flex items-center gap-3 hover:bg-panel-light transition-colors">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text">{t("brandName")}</h1>
          <p className="text-[10px] text-text-muted">{t("brandTagline")}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navConfig.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-secondary hover:bg-panel-light hover:text-text"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Shortcuts + Language */}
      <div className="px-3 mb-2 space-y-1">
        <button
          onClick={toggleHotkeyHelp}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
          title={t("shortcutsTooltip")}
        >
          <Keyboard className="w-5 h-5" />
          {t("shortcuts")}
        </button>
        <LocaleSwitcher />
      </div>

      {/* Level + XP */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold ${levelInfo.color}`}>
            {t("levelLabel", { level: levelInfo.level, name: levelName })}
          </span>
          <span className="text-[10px] text-text-muted">
            {t("xpProgress", {
              current: allTimeScore.toLocaleString(),
              next: levelInfo.nextThreshold === Infinity ? "∞" : levelInfo.nextThreshold.toLocaleString(),
            })}
          </span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
          />
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-t border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-text">{displayName}</p>
          <p className="text-xs text-text-muted">{displayRole}</p>
        </div>
      </div>
    </aside>
  );
}
