"use client";
import Link from "next/link";
import { AudioLines, LayoutDashboard, List, BarChart3, FolderOpen, Settings } from "lucide-react";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Sessions", href: "/sessions", icon: List },
  { label: "Analysis", href: "/analysis", icon: BarChart3 },
  { label: "File Manager", href: "/files", icon: FolderOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ activePath = "/" }: { activePath?: string }) {
  return (
    <aside className="w-60 bg-panel border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text">SpectroTag</h1>
          <p className="text-[10px] text-text-muted">Smart Spectro-Tagging & Anomaly Detection</p>
        </div>
      </div>

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
          AR
        </div>
        <div>
          <p className="text-sm font-medium text-text">Alex Ross</p>
          <p className="text-xs text-text-muted">Lead Engineer</p>
        </div>
      </div>
    </aside>
  );
}
