// app/(public)/login/page.tsx

import Link from "next/link";
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-end mb-2">
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link className="hover:text-gray-900 transition-colors" href="/">홈으로</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/signup">회원가입</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/plan">이용권</Link>
              <Link className="hover:text-gray-900 transition-colors" href="/support">고객센터</Link>
            </nav>
          </div>

          {/* Main Header Row */}
          <div className="flex items-center justify-between gap-8">
            {/* Brand Logo */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0 -mt-8">
              <div className="h-12 w-12 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" className="text-teal-400">
                  <g transform="translate(24,24)">
                    <circle cx="0" cy="0" r="3" fill="currentColor" />
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(0)"/>
                    <circle cx="16" cy="0" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(60)"/>
                    <circle cx="8" cy="13.86" r="2" fill="currentColor"/>
                    <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(120)"/>
                    <circle cx="-8" cy="13.86" r="2" fill="currentColor"/>
                  </g>
                </svg>
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">그레이트 시니어</h1>
                <p className="text-sm text-gray-600">네트워크</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-sm">
            <LoginForm initialError={error} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-900">Great Senior</span>
                <span className="text-lg text-gray-600">network</span>
                <span className="ml-4 text-sm text-gray-500">제휴문의 | 이메일 무단 수집 거부</span>
              </div>
              <div className="text-sm text-gray-600 space-y-2 max-w-2xl">
                <p>
                  <span className="font-medium">마인드라</span> 대표자 서현숙 
                  <span className="ml-4 font-medium">사업자등록번호:</span> 255-37-01508
                </p>
                <p>경기도 고양시 일산동구 중앙로 1036 4층(고양중장년기술창업센터, 1-1층)</p>
                <p><span className="font-medium">통신판매신고번호:</span> 제2025-고양일산동-0921호</p>
                <p className="text-gray-500 pt-2">
                  Copyright 2025. MINDRA INC. All rights reserved.
                </p>
              </div>
            </div>

            <div className="lg:text-right">
              <p className="text-sm text-gray-500 mb-2">FAMILY SITE</p>
              <div className="flex items-center justify-start lg:justify-end">
                <span className="text-lg font-bold text-gray-900">
                  Mind<span className="text-teal-500">ra</span>
                </span>
                <button 
                  aria-label="패밀리 사이트 메뉴 열기"
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
