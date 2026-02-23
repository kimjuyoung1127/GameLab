/** 좌측 사이드바: 네비게이션 링크, 유저 정보, auth-store 연동. */
"use client";
import Link from "next/link";
import { AudioLines, LayoutDashboard, List, Trophy, Upload } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth-store";

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Upload", href: "/upload", icon: Upload },
  { label: "Sessions", href: "/sessions", icon: List },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

export default function Sidebar({ activePath = "/" }: { activePath?: string }) {
  const { user, isBypass } = useAuthStore();

  const displayName = isBypass
    ? "Dev User"
    : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayRole = isBypass ? "Debug Mode" : "Engineer";
  const initials = isBypass
    ? "DU"
    : displayName
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
          <h1 className="text-sm font-bold text-text">SpectroTag</h1>
          <p className="text-[10px] text-text-muted">Smart Spectro-Tagging & Anomaly Detection</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
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
              {item.label}
            </Link>
          );
        })}
      </nav>

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
