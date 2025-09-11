// app/(public)/login/page.tsx

import LoginForm from "./Loginform"; // 대소문자 일치!
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - DigitalNote",
  description: "DigitalNote에 로그인하여 디지털 자서전과 인생그래프를 만들어보세요.",
};

type SP = Record<string, string | string[] | undefined>;
const firstString = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const sp = ((await searchParams) ?? {}) as SP;
  const error = firstString(sp?.error) ?? "";

  return (
    <main className="fixed inset-0 overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      {/* 배경 장식 (작고 은은하게) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 right-6 w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl sm:blur-2xl opacity-30" />
        <div className="absolute bottom-6 left-6 w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-xl sm:blur-2xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-xl sm:blur-2xl opacity-20" />
      </div>

      {/* 로그인 카드 */}
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
