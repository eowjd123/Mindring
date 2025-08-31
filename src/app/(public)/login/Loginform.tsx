// app/(public)/login/LoginForm.tsx
"use client";

import { ArrowRight, Eye, EyeOff, Home, Lock, Mail } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = { initialError?: string };

export default function LoginForm({ initialError = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [err, setErr] = useState<string>(initialError);
  const [emailErr, setEmailErr] = useState<string>("");
  const [pwErr, setPwErr] = useState<string>("");

  const emailRe = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i, []);
  const pwRe = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/u, []);

  function validateEmail(v: string) {
    if (!v) return "이메일을 입력해주세요.";
    if (!emailRe.test(v)) return "이메일 형식이 올바르지 않습니다.";
    return "";
  }
  function validatePw(v: string) {
    if (!v) return "비밀번호를 입력해주세요.";
    if (!pwRe.test(v)) return "8자 이상, 영문/숫자를 포함해야 합니다.";
    return "";
  }

  useEffect(() => {
    if (initialError) setErr(initialError);
  }, [initialError]);

  function onEmailChange(v: string) {
    setEmail(v);
    if (emailErr) setEmailErr(validateEmail(v));
  }
  function onPwChange(v: string) {
    setPassword(v);
    if (pwErr) setPwErr(validatePw(v));
  }

  const formValid =
    !validateEmail(email) && !validatePw(password) && !isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const eErr = validateEmail(email);
    const pErr = validatePw(password);
    setEmailErr(eErr);
    setPwErr(pErr);
    if (eErr || pErr) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await safeJson(res);
        setErr(humanizeError(j?.error ?? "로그인에 실패했어요. 다시 시도해주세요."));
        return;
      }
      startTransition(() => router.replace("/dashboard"));
    } catch {
      setErr("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  function onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter") {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        e.preventDefault();
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/img/OBJECTS.png" 
              alt="DigitalNote Logo" 
              className="mx-auto w-20 h-20 object-contain mb-6"
            />
            <img 
              src="/img/maind.png" 
              alt="마인드" 
              className="mx-auto mb-4 max-h-12 object-contain"
            />
            <p className="text-gray-600 text-sm leading-relaxed">
              디지털 자서전과 인생그래프로 당신의 이야기를 기록하세요
            </p>
          </div>

          {/* Error message */}
          {err && (
            <div role="alert" className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {err}
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit} onKeyDown={onFormKeyDown} noValidate>
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.currentTarget.value)}
                  onBlur={() => setEmailErr(validateEmail(email))}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all duration-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 ${
                    emailErr 
                      ? "border-red-300 focus:ring-red-100" 
                      : "border-gray-200 focus:border-purple-300 focus:ring-purple-100"
                  }`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              {emailErr && (
                <p className="mt-1.5 text-xs text-red-600">{emailErr}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPwChange(e.currentTarget.value)}
                  onBlur={() => setPwErr(validatePw(password))}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border transition-all duration-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 ${
                    pwErr 
                      ? "border-red-300 focus:ring-red-100" 
                      : "border-gray-200 focus:border-purple-300 focus:ring-purple-100"
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {pwErr ? (
                <p className="mt-1.5 text-xs text-red-600">{pwErr}</p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500">8자 이상, 영문/숫자 각각 1자 이상 포함</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={!formValid} 
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center justify-center group"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Sign up link */}
            <Link 
              href="/signup" 
              className="block w-full text-center py-4 px-6 border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              아직 계정이 없으신가요? 회원가입하기
            </Link>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-medium">또는</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-gray-700 mb-4">간편 로그인</p>
            <div className="grid grid-cols-2 gap-3">
              <a 
                className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 group text-sm font-medium"
                href="/api/auth/kakao/start"
              >
                <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
                카카오
              </a>
              <a 
                className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group text-sm font-medium"
                href="/api/auth/naver/start"
              >
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                네이버
              </a>
              <a 
                className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group text-sm font-medium"
                href="/api/auth/google/start"
              >
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded mr-2"></div>
                구글
              </a>
              <a 
                className="flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group text-sm font-medium"
                href="/api/auth/apple/start"
              >
                <div className="w-4 h-4 bg-gray-800 rounded mr-2"></div>
                애플
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <Link 
              href="/" 
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <Home className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
              홈으로
            </Link>
            <span className="font-semibold text-gray-600">
              DigitalNote
            </span>
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
    case "INVALID_CREDENTIALS": return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "TOO_MANY_REQUESTS": return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    default: return codeOrMsg;
  }
}