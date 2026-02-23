/** 대시보드 셸: 사이드바 + TopBar + 메인 콘텐츠 3패널 레이아웃, 모바일 햄버거. */
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import HotkeyHelp from "./HotkeyHelp";
import UnsavedModal from "./UnsavedModal";
import Toast from "../ui/Toast";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-panel border border-border md:hidden"
        aria-label="Open menu"
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
          <Sidebar activePath={pathname} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-panel-light md:hidden"
            aria-label="Close menu"
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
