/** 인증 상태 구독: onAuthStateChange 리스너 등록, auth-store와 동기화. */
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isBypass, setUser } = useAuthStore();

  useEffect(() => {
    if (isBypass) return;

    const supabase = createClient();

    // 초기 세션 로드
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 실시간 인증 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isBypass, setUser]);

  return <>{children}</>;
}
