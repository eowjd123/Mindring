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

  // 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string>(initialError);
  const [emailErr, setEmailErr] = useState<string>("");
  const [pwErr, setPwErr] = useState<string>("");

  // ⬇️ 화면 높이 기반 "컴팩트 모드" (작은 화면에서 자동 축소)
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const apply = () => {
      // 임계값은 실제 UI에 맞춰 조정 가능 (작으면 true)
      const h = window.innerHeight;
      setCompact(h < 720); // 720px 미만이면 컴팩트 모드
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // 검증
  const emailRe = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i, []);
  const pwRe = useMemo(() => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/u, []);
  const validateEmail = (v: string) =>
    !v ? "이메일을 입력해주세요." : !emailRe.test(v) ? "이메일 형식이 올바르지 않습니다." : "";
  const validatePw = (v: string) =>
    !v ? "비밀번호를 입력해주세요." : !pwRe.test(v) ? "8자 이상, 영문/숫자를 포함해야 합니다." : "";

  useEffect(() => {
    if (initialError) setErr(initialError);
  }, [initialError]);

  const formValid = !validateEmail(email) && !validatePw(password) && !isPending;

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
      if (tag === "input" || tag === "textarea" || tag === "select") e.preventDefault();
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* 고정 높이 제거: 자연 높이 + 최대 높이(뷰포트 절대 초과 금지) */}
      <div
        className={[
          "bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden",
          "flex flex-col",
          "max-h-[92vh]",
        ].join(" ")}
      >
        {/* 본문: 컴팩트 모드에 따라 여백/폰트/요소 크기 축소 */}
        <div className={(compact ? "px-5 py-4" : "px-6 py-6") + " flex-1"}>
          {/* 로고 + 카피 */}
          <div className={"text-center " + (compact ? "mb-3" : "mb-5")}>
            <img
              src="/img/OBJECTS.png"
              alt="DigitalNote Logo"
              className={[
                "mx-auto object-contain",
                compact ? "w-12 h-12 mb-2" : "w-14 h-14 mb-3",
              ].join(" ")}
            />
            <img
              src="/img/maind.png"
              alt="마인드"
              className={["mx-auto object-contain", compact ? "mb-1 max-h-7" : "mb-2 max-h-9"].join(" ")}
            />
            {/* 화면이 낮으면 설명은 더 작게 또는 숨김 */}
            {!compact ? (
              <p className="text-gray-600 text-xs leading-relaxed">
                디지털 자서전과 인생그래프로 당신의 이야기를 기록하세요
              </p>
            ) : (
              <p className="text-gray-600 text-[11px] leading-snug">당신의 이야기를 기록하세요</p>
            )}
          </div>

          {/* 에러 */}
          {err && (
            <div
              role="alert"
              className={[
                "rounded-lg border text-red-700",
                compact ? "mb-2 p-2 text-[11px] bg-red-50 border-red-100" : "mb-3 p-3 text-xs bg-red-50 border-red-100",
              ].join(" ")}
            >
              {err}
            </div>
          )}

          {/* 폼 */}
          <form
            className={compact ? "space-y-3" : "space-y-3.5"}
            onSubmit={onSubmit}
            onKeyDown={onFormKeyDown}
            noValidate
          >
            {/* 이메일 */}
            <div>
              <label className={"block font-medium text-gray-700 " + (compact ? "text-[11px] mb-1" : "text-xs mb-1.5")}>
                이메일 주소
              </label>
              <div className="relative">
                <Mail className={"absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 " + (compact ? "w-4 h-4" : "w-4 h-4")} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setEmail(v);
                    if (emailErr) setEmailErr(validateEmail(v));
                  }}
                  onBlur={() => setEmailErr(validateEmail(email))}
                  className={[
                    "w-full rounded-lg border transition-all duration-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2",
                    compact ? "pl-10 pr-3 py-2.5 text-sm" : "pl-10 pr-3 py-3 text-sm",
                    emailErr ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-purple-300 focus:ring-purple-100",
                  ].join(" ")}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              {emailErr && <p className={compact ? "mt-1 text-[11px] text-red-600" : "mt-1 text-[11px] text-red-600"}>{emailErr}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className={"block font-medium text-gray-700 " + (compact ? "text-[11px] mb-1" : "text-xs mb-1.5")}>
                비밀번호
              </label>
              <div className="relative">
                <Lock className={"absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 " + (compact ? "w-4 h-4" : "w-4 h-4")} />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setPassword(v);
                    if (pwErr) setPwErr(validatePw(v));
                  }}
                  onBlur={() => setPwErr(validatePw(password))}
                  className={[
                    "w-full rounded-lg border transition-all duration-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2",
                    compact ? "pl-10 pr-10 py-2.5 text-sm" : "pl-10 pr-10 py-3 text-sm",
                    pwErr ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-purple-300 focus:ring-purple-100",
                  ].join(" ")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className={"absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors " + (compact ? "" : "")}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwErr ? (
                <p className="mt-1 text-[11px] text-red-600">{pwErr}</p>
              ) : (
                <p className="mt-1 text-[11px] text-gray-500">8자 이상, 영문/숫자 각각 1자 이상 포함</p>
              )}
            </div>

            {/* 제출 */}
            <div className={compact ? "pt-1" : "pt-1.5"}>
              <button
                type="submit"
                disabled={!formValid}
                className={[
                  "w-full text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200",
                  "bg-gradient-to-r from-purple-500 to-blue-500",
                  compact ? "py-2.5 px-4" : "py-3 px-5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg",
                  "flex items-center justify-center group",
                ].join(" ")}
              >
                {isPending ? (
                  <>
                    <div className={compact ? "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" : "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"} />
                    로그인 중...
                  </>
                ) : (
                  <>
                    로그인
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* 회원가입 */}
            <Link
              href="/signup"
              className={[
                "block w-full text-center border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200",
                compact ? "py-2.5 px-4 text-sm" : "py-3 px-5 text-sm",
              ].join(" ")}
            >
              아직 계정이 없으신가요? 회원가입하기
            </Link>
          </form>

          {/* 구분선: 컴팩트 시 간격 축소/텍스트 소형 */}
          <div className={compact ? "relative my-3" : "relative my-5"}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className={compact ? "px-2 bg-white text-[11px] text-gray-500" : "px-2 bg-white text-[11px] text-gray-500"}>
                또는
              </span>
            </div>
          </div>

          {/* 간편 로그인: 유지. 컴팩트에서는 텍스트 축소/숨김 */}
          <div className="space-y-2">
            <p className={compact ? "text-center text-[11px] font-medium text-gray-700 mb-1" : "text-center text-xs font-medium text-gray-700 mb-1.5"}>
              간편 로그인
            </p>
            <div className="grid grid-cols-4 gap-2">
              <a href="/api/auth/kakao/start" aria-label="카카오로 로그인" className="flex items-center justify-center py-2 px-2 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 text-sm">
                <span className="w-4 h-4 bg-yellow-400 rounded" />
                {!compact && <span className="ml-1">카카오</span>}
              </a>
              <a href="/api/auth/naver/start" aria-label="네이버로 로그인" className="flex items-center justify-center py-2 px-2 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-sm">
                <span className="w-4 h-4 bg-green-500 rounded" />
                {!compact && <span className="ml-1">네이버</span>}
              </a>
              <a href="/api/auth/google/start" aria-label="구글로 로그인" className="flex items-center justify-center py-2 px-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm">
                <span className="w-4 h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded" />
                {!compact && <span className="ml-1">구글</span>}
              </a>
            </div>
          </div>
        </div>

        {/* 푸터 (항상 카드 하단에 고정) */}
        <div className={(compact ? "px-5 py-3" : "px-6 py-4") + " bg-gray-50 border-t border-gray-100"}>
          <div className="flex items-center justify-between text-xs">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors group">
              <Home className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              홈으로
            </Link>
            <span className="font-semibold text-gray-600">DigitalNote</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function humanizeError(codeOrMsg: string) {
  switch (codeOrMsg) {
    case "INVALID_CREDENTIALS":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "TOO_MANY_REQUESTS":
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    default:
      return codeOrMsg;
  }
}
