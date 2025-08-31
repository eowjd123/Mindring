// lib/session.ts

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

const COOKIE = "dn.sid";
const SECRET = process.env.SESSION_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

// 빌드 시에만 기본값 허용, 프로덕션에서는 반드시 환경 변수 필요
if (!SECRET) {
  if (IS_PROD) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  } else {
    console.warn("⚠️ SESSION_SECRET not set, using development default. Do not use in production!");
  }
}

// 프로덕션에서는 환경 변수 필수, 개발 환경에서는 기본값 사용
const SESSION_SECRET: string = SECRET || "dev-secret-not-for-production-use-only-fallback";

/** HMAC 서명/검증 */
function sign(value: string) {
  const sig = createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string | undefined | null) {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const val = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expect = createHmac("sha256", SESSION_SECRET).update(val).digest("hex");
  try {
    // 상수 시간 비교
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? val : null;
  } catch {
    return null;
  }
}

/** 세션 발급
 * @param ttlHours 기본 30일 (720h)
 * @param uaFingerprint 선택: user-agent + ip 해시 등
 */
export async function issueSession(
  userId: string,
  ttlHours = 720,
  uaFingerprint?: string | null
) {
  const sessionId = randomBytes(12).toString("hex"); // 24자로 줄임
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

  await prisma.session.create({
    data: {
      sessionId,
      userId,
      expiresAt,
      uaFingerprint: uaFingerprint ?? null,
    },
  });

  const jar = await cookies(); // await 추가
  jar.set({
    name: COOKIE,
    value: sign(sessionId),
    httpOnly: true,
    secure: IS_PROD, // prod에서만 Secure 강제
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** 현재 세션 조회 (없으면 null) */
export async function getSession() {
  const jar = await cookies(); // await 추가
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const sid = unsign(raw);
  if (!sid) return null;

  const session = await prisma.session.findUnique({
    where: { sessionId: sid },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return session;
}

/** 현재 로그인 사용자 조회 (없으면 null) */
export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { userId: session.userId } });
}

/** 세션 만료 연장(슬라이딩 만료)
 * 마지막 사용 시점에 만료를 연장하고 싶을 때 사용
 */
export async function extendSession(hours = 24) {
  const session = await getSession();
  if (!session) return false;
  const newExp = new Date(Date.now() + hours * 3600 * 1000);
  await prisma.session.update({
    where: { sessionId: session.sessionId },
    data: { expiresAt: newExp },
  });
  // 쿠키도 갱신
  const jar = await cookies(); // await 추가
  jar.set({
    name: COOKIE,
    value: sign(session.sessionId),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    expires: newExp,
  });
  return true;
}

/** 세션 폐기(로그아웃) */
export async function revokeSession() {
  const jar = await cookies(); // await 추가
  const raw = jar.get(COOKIE)?.value;
  if (!raw) {
    // 쿠키만 제거 후 종료
    jar.set({ name: COOKIE, value: "", path: "/", expires: new Date(0) });
    return;
  }
  const sid = unsign(raw);
  // 쿠키는 항상 제거
  jar.set({ name: COOKIE, value: "", path: "/", expires: new Date(0) });
  if (!sid) return;

  try {
    await prisma.session.update({
      where: { sessionId: sid },
      data: { revokedAt: new Date() },
    });
  } catch {
    // 이미 지워졌거나 존재하지 않아도 무시
  }
}

/** 보호 라우트 가드: 없으면 로그인으로 리다이렉트 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?error=UNAUTHORIZED");
  }
  return user;
}