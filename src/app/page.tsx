import { getSessionUser } from "@/lib/session";
// app/page.tsx
import { redirect } from "next/navigation";

// 루트 접근 시: 로그인되어 있으면 /dashboard, 아니면 /(public)/login 으로
export default async function RootPage() {
  const me = await getSessionUser();
  if (me) {
    redirect("/dashboard");
  }
  redirect("/login");
}
