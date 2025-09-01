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
    <div className="space-y-6 border bg-white rounded-xl p-6 shadow-sm">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="text-sm text-gray-500">이메일과 비밀번호로 계정을 생성하세요.</p>
      </header>

      {err ? <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div> : null}

      <form className="space-y-3" onSubmit={onSubmit} onKeyDown={onKeyDown} noValidate>
        <label className="block">
          <span className="text-sm font-medium">이름(선택)</span>
          <input value={name} onChange={(e) => setName(e.currentTarget.value)} className="mt-1 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300" placeholder="홍길동" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">이메일</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} className="mt-1 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300" placeholder="you@example.com" autoComplete="email" required />
        </label>

        <label className="block">
          <span className="text-sm font-medium">비밀번호</span>
          <div className="mt-1 flex rounded border focus-within:ring-2 focus-within:ring-gray-300">
            <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.currentTarget.value)} className="w-full rounded-l px-3 py-2 outline-none" placeholder="••••••••" autoComplete="new-password" required />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="px-3 text-sm text-gray-600 hover:bg-gray-50 rounded-r border-l" aria-pressed={showPw} aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"} title={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}>
              {showPw ? "숨김" : "보기"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">8자 이상, 영문/숫자 각각 1자 이상 포함</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium">비밀번호 확인</span>
          <input type={showPw ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.currentTarget.value)} className="mt-1 w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300" placeholder="••••••••" autoComplete="new-password" required />
        </label>

        <button type="submit" disabled={!canSubmit} className="w-full rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-60">
          {isPending ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <footer className="flex justify-between text-sm text-gray-500">
        <Link href="/login">이미 계정이 있으신가요? 로그인</Link>
        <span>DigitalNote</span>
      </footer>
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
