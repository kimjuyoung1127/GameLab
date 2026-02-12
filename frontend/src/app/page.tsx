import { redirect } from "next/navigation";

export default function RootPage() {
  const bypassLogin = process.env.NEXT_PUBLIC_BYPASS_LOGIN !== "false";
  redirect(bypassLogin ? "/sessions" : "/login");
}
