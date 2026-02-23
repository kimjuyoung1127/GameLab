/** 언어 전환 토글: 한국어 ↔ English. 쿠키 기반. */
"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale() {
    const next = locale === "ko" ? "en" : "ko";
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-panel-light hover:text-text transition-colors"
      title={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      <Globe className="w-5 h-5" />
      {locale === "ko" ? "English" : "한국어"}
    </button>
  );
}
