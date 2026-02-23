/** 대시보드 메인 페이지: /overview로 리다이렉트. */
import { redirect } from "next/navigation";
export default function DashboardPage() {
  redirect("/overview");
}
