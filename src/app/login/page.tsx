// app/(public)/login/page.tsx

import LoginForm from "./Loginform"; // <-- 파일명 대소문자 일치!
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - DigitalNote",
  description: "DigitalNote에 로그인하여 디지털 자서전과 인생그래프를 만들어보세요.",
};

type SP = Record<string, string | string[] | undefined>;

function firstString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function LoginPage({
  searchParams,
}: {
  // Next 타입 생성기와 호환: Promise 형태 유지
  searchParams?: Promise<SP>;
}) {
  // Promise 안전 해제 (+ undefined 대비)
  const sp = ((await searchParams) ?? {}) as SP;

  const error = firstString(sp.error) ?? "";

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-20" />
      </div>

      {/* 본문 */}
      <div className="relative z-10 w-full max-w-md">
        <LoginForm initialError={error} />
      </div>

      {/* 떠있는 포인트들 */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      <div className="absolute top-1/4 right-10 w-1 h-1 bg-blue-400 rounded-full animate-ping" />
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-indigo-300 rounded-full animate-bounce" />
      <div className="absolute bottom-10 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
    </main>
  );
}
