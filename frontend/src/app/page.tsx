/** 루트 페이지: 로그인 bypass 설정에 따라 /sessions 또는 /login으로 리다이렉트. */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const bypassLogin = process.env.NEXT_PUBLIC_BYPASS_LOGIN !== "false";

  if (bypassLogin) {
    redirect("/sessions");
  }

  // 비-bypass: 서버에서 실제 세션 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/sessions" : "/login");
}
