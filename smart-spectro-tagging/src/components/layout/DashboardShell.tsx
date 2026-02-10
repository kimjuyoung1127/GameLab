"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar activePath={pathname} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
