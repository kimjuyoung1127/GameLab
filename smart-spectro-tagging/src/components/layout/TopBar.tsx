"use client";
import { Bell, HelpCircle } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-panel flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-bold text-text">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-panel-light transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
        </button>
        <button className="p-2 rounded-lg hover:bg-panel-light transition-colors">
          <HelpCircle className="w-5 h-5 text-text-secondary" />
        </button>
      </div>
    </header>
  );
}
