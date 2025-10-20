// app/(public)/signup/SignupForm.tsx
"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = { initialError?: string };

export default function SignupForm({ initialError = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [err, setErr] = useState(initialError);
  const emailRe = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i, []);
  const pwRe = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/u, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter") e.preventDefault();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRe.test(normalizedEmail)) { setErr("이메일 형식이 올바르지 않습니다."); return; }
    if (!pwRe.test(pw)) { setErr("비밀번호는 8자 이상, 영문/숫자를 포함해야 합니다."); return; }
    if (pw !== pw2) { setErr("비밀번호가 일치하지 않습니다."); return; }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password: pw, confirm: pw2 }),
    });

    if (!res.ok) {
      const j = await safeJson(res);
      setErr(humanizeError(j?.error ?? "회원가입에 실패했습니다."));
      return;
    }
    startTransition(() => router.replace("/dashboard"));
  }

  const canSubmit = emailRe.test(email.trim().toLowerCase()) && pwRe.test(pw) && pw === pw2 && !isPending;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="px-6 py-6">
        <header className="text-center space-y-2 mb-6">
          {/* 브랜드 로고 - 메인 페이지와 동일한 스타일 */}
          <div className="flex flex-col items-center gap-2 mb-4">
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
          <h2 className="text-xl font-bold text-gray-900">회원가입</h2>
          <p className="text-sm text-gray-500">이메일과 비밀번호로 계정을 생성하세요.</p>
        </header>

        {err ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">{err}</div> : null}

        <form className="space-y-4" onSubmit={onSubmit} onKeyDown={onKeyDown} noValidate>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">이름(선택)</span>
            <input 
              value={name} 
              onChange={(e) => setName(e.currentTarget.value)} 
              className="w-full rounded-full border-2 border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100" 
              placeholder="홍길동" 
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">이메일</span>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.currentTarget.value)} 
              className="w-full rounded-full border-2 border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100" 
              placeholder="you@example.com" 
              autoComplete="email" 
              required 
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호</span>
            <div className="relative">
              <input 
                type={showPw ? "text" : "password"} 
                value={pw} 
                onChange={(e) => setPw(e.currentTarget.value)} 
                className="w-full rounded-full border-2 border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100" 
                placeholder="••••••••" 
                autoComplete="new-password" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPw((v) => !v)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-pressed={showPw} 
                aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"} 
                title={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPw ? "숨김" : "보기"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">8자 이상, 영문/숫자 각각 1자 이상 포함</p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">비밀번호 확인</span>
            <input 
              type={showPw ? "text" : "password"} 
              value={pw2} 
              onChange={(e) => setPw2(e.currentTarget.value)} 
              className="w-full rounded-full border-2 border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100" 
              placeholder="••••••••" 
              autoComplete="new-password" 
              required 
            />
          </label>

          <button 
            type="submit" 
            disabled={!canSubmit} 
            className="w-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 px-4 py-3 font-medium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
          >
            {isPending ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <Link href="/login" className="hover:text-teal-600 transition-colors">이미 계정이 있으신가요? 로그인</Link>
            <span>그레이트 시니어</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

function humanizeError(codeOrMsg: string) {
  switch (codeOrMsg) {
    case "INVALID_EMAIL": return "이메일 형식이 올바르지 않습니다.";
    case "WEAK_PASSWORD": return "비밀번호는 8자 이상, 영문/숫자를 포함해야 합니다.";
    case "PASSWORD_MISMATCH": return "비밀번호가 일치하지 않습니다.";
    case "EMAIL_EXISTS": return "이미 가입된 이메일입니다.";
    default: return codeOrMsg;
  }
}
