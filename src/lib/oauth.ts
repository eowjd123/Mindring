// lib/oauth.ts
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { User } from "@prisma/client";
import { upsertUserFromSocial } from "./auth-social";

/** ===== Provider 타입 & 가드 ===== */
export const PROVIDERS = ["kakao", "naver", "google", "apple"] as const;
export type Provider = typeof PROVIDERS[number];
export function isProvider(p: string): p is Provider {
  return (PROVIDERS as readonly string[]).includes(p);
}

export type StartContext = {
  url: string;
  state: string;
  codeVerifier: string;
  codeChallenge: string;
};

type CallbackParams = { code: string; state: string };

const SECRET = process.env.SESSION_SECRET!;
const TEMP_COOKIE = "dn.oauth.tmp"; // state/PKCE 임시 저장 (httpOnly)

/** ===== PKCE/유틸 ===== */
function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function randomString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}

function sha256(data: string) {
  return crypto.createHash("sha256").update(data).digest();
}

function sign(value: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}
function unsign(signed: string | undefined | null) {
  if (!signed) return null;
  const [val, sig] = signed.split(".");
  if (!val || !sig) return null;
  const expect = crypto.createHmac("sha256", SECRET).update(val).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? val : null;
}

async function setTemp(provider: Provider, state: string, codeVerifier: string) {
  const jar = await cookies();
  const payload = JSON.stringify({ provider, state, codeVerifier, at: Date.now() });
  jar.set({
    name: TEMP_COOKIE,
    value: sign(payload),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 10 * 60 * 1000), // 10분
  });
}

async function getAndClearTemp(): Promise<{ provider: Provider; state: string; codeVerifier: string } | null> {
  const jar = await cookies();
  const raw = jar.get(TEMP_COOKIE)?.value;
  const val = unsign(raw);
  // 항상 소거
  jar.set({ name: TEMP_COOKIE, value: "", path: "/", expires: new Date(0) });
  if (!val) return null;
  try {
    const obj = JSON.parse(val);
    return obj;
  } catch {
    return null;
  }
}

/** ===== 프로바이더 설정 ===== */
const endpoints = {
  kakao: {
    auth: "https://kauth.kakao.com/oauth/authorize",
    token: "https://kauth.kakao.com/oauth/token",
    userinfo: "https://kapi.kakao.com/v2/user/me",
    scope: "profile_nickname profile_image account_email",
    clientId: process.env.KAKAO_CLIENT_ID!,
    clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    redirectUri: process.env.KAKAO_REDIRECT_URI!,
  },
  naver: {
    auth: "https://nid.naver.com/oauth2.0/authorize",
    token: "https://nid.naver.com/oauth2.0/token",
    userinfo: "https://openapi.naver.com/v1/nid/me",
    scope: "name email",
    clientId: process.env.NAVER_CLIENT_ID!,
    clientSecret: process.env.NAVER_CLIENT_SECRET!,
    redirectUri: process.env.NAVER_REDIRECT_URI!,
  },
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  },
  apple: {
    auth: "https://appleid.apple.com/auth/authorize",
    token: "https://appleid.apple.com/auth/token",
    // Apple은 별도 userinfo가 없고 id_token에 포함됨
    scope: "openid email name",
    clientId: process.env.APPLE_CLIENT_ID!,
    teamId: process.env.APPLE_TEAM_ID!,
    keyId: process.env.APPLE_KEY_ID!,
    privateKey: process.env.APPLE_PRIVATE_KEY!,
    redirectUri: process.env.APPLE_REDIRECT_URI!,
  },
} as const satisfies Record<
  Provider,
  {
    auth: string;
    token: string;
    userinfo?: string; // apple은 없음
    scope: string;
    clientId: string;
    clientSecret?: string; // apple은 별도 JWT
    redirectUri: string;
    teamId?: string;
    keyId?: string;
    privateKey?: string;
  }
>;

/** ===== Apple client secret (JWT) 생성 ===== */
async function createAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60 * 24; // 24h
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: endpoints.apple.keyId!, typ: "JWT" })
    .setIssuer(endpoints.apple.teamId!) // iss: Team ID
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setAudience("https://appleid.apple.com")
    .setSubject(endpoints.apple.clientId) // sub: Service ID
    .sign(
      crypto.createPrivateKey(endpoints.apple.privateKey!).export({ type: "pkcs8", format: "pem" }) as unknown as Uint8Array
    );
  return token;
}

/** ===== 토큰 교환 공통 ===== */
async function postForm<T>(
  url: string,
  body: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) params.set(k, String(v));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Token request failed: ${res.status} ${txt}`);
  }
  const data: unknown = await res.json();
  return data as T;
}

/** ===== 시작 URL 생성 ===== */
export async function createAuthStartUrl(provider: Provider): Promise<string> {
  const state = randomString(16);
  const codeVerifier = randomString(48);
  const codeChallenge = base64url(sha256(codeVerifier));
  await setTemp(provider, state, codeVerifier);

  switch (provider) {
    case "kakao": {
      const p = endpoints.kakao;
      const url = new URL(p.auth);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", p.clientId);
      url.searchParams.set("redirect_uri", p.redirectUri);
      url.searchParams.set("scope", p.scope);
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      return url.toString();
    }
    case "naver": {
      const p = endpoints.naver;
      const url = new URL(p.auth);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", p.clientId);
      url.searchParams.set("redirect_uri", p.redirectUri);
      url.searchParams.set("state", state);
      // (선택) PKCE: 네이버는 필수 아님, 붙여도 무해
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("scope", p.scope);
      return url.toString();
    }
    case "google": {
      const p = endpoints.google;
      const url = new URL(p.auth);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", p.clientId);
      url.searchParams.set("redirect_uri", p.redirectUri);
      url.searchParams.set("scope", p.scope);
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline"); // refresh_token 요청
      url.searchParams.set("include_granted_scopes", "true");
      url.searchParams.set("prompt", "consent"); // 항상 refresh 부여 목적
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      return url.toString();
    }
    case "apple": {
      const p = endpoints.apple;
      const url = new URL(p.auth);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("response_mode", "query");
      url.searchParams.set("client_id", p.clientId);
      url.searchParams.set("redirect_uri", p.redirectUri);
      url.searchParams.set("scope", p.scope);
      url.searchParams.set("state", state);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      return url.toString();
    }
  }
}

/** ===== 콜백 처리: code→token→profile =====
 * 실패 시 항상 throw → 반환 타입은 Promise<User>
 */
export async function exchangeCodeForProfile(provider: Provider, { code, state }: CallbackParams): Promise<User> {
  const tmp = await getAndClearTemp();
  if (!tmp || tmp.provider !== provider || tmp.state !== state) {
    throw new Error("OAUTH_STATE_MISMATCH");
  }
  const codeVerifier = tmp.codeVerifier;

  // 요청 타임아웃 (15초)
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 15_000);

  try {
    switch (provider) {
      case "kakao": {
        const p = endpoints.kakao;
        const token = await postForm<{
          access_token: string;
          refresh_token?: string;
          token_type: string;
          expires_in: number;
        }>(p.token, {
          grant_type: "authorization_code",
          client_id: p.clientId,
          client_secret: p.clientSecret!,
          redirect_uri: p.redirectUri,
          code,
          code_verifier: codeVerifier,
        }, ac.signal);

        const ures = await fetch(p.userinfo, { headers: { Authorization: `Bearer ${token.access_token}` }, signal: ac.signal });
        if (!ures.ok) throw new Error(`userinfo failed: ${ures.status}`);
        const user = await ures.json();
        const id = String(user.id);
        const email = user.kakao_account?.email ?? null;
        const displayName = user.kakao_account?.profile?.nickname ?? null;
        const avatarUrl = user.kakao_account?.profile?.profile_image_url ?? null;

        const me = await upsertUserFromSocial({
          provider: "kakao",
          providerUserId: id,
          email,
          displayName,
          avatarUrl,
          refreshTokenEnc: token.refresh_token ?? null,
        });
        if (!me) throw new Error("USER_UPSERT_FAILED");
        return me;
      }

      case "naver": {
        const p = endpoints.naver;
        const token = await postForm<{
          access_token: string;
          refresh_token?: string;
          token_type: string;
          expires_in: string;
        }>(p.token, {
          grant_type: "authorization_code",
          client_id: p.clientId,
          client_secret: p.clientSecret!,
          redirect_uri: p.redirectUri,
          code,
          state,
          code_verifier: codeVerifier,
        }, ac.signal);

        const ures = await fetch(p.userinfo, { headers: { Authorization: `Bearer ${token.access_token}` }, signal: ac.signal });
        if (!ures.ok) throw new Error(`userinfo failed: ${ures.status}`);
        const data = await ures.json();
        const resp = data.response ?? {};

        const me = await upsertUserFromSocial({
          provider: "naver",
          providerUserId: String(resp.id),
          email: resp.email ?? null,
          displayName: resp.name ?? null,
          avatarUrl: resp.profile_image ?? null,
          refreshTokenEnc: token.refresh_token ?? null,
        });
        if (!me) throw new Error("USER_UPSERT_FAILED");
        return me;
      }

      case "google": {
        const p = endpoints.google;
        const token = await postForm<{
          access_token: string;
          refresh_token?: string;
          id_token: string;
          token_type: string;
          expires_in: number;
          scope: string;
        }>(p.token, {
          grant_type: "authorization_code",
          client_id: p.clientId,
          client_secret: p.clientSecret!,
          redirect_uri: p.redirectUri,
          code,
          code_verifier: codeVerifier,
        }, ac.signal);

        const ures = await fetch(p.userinfo, { headers: { Authorization: `Bearer ${token.access_token}` }, signal: ac.signal });
        if (!ures.ok) throw new Error(`userinfo failed: ${ures.status}`);
        const prof = await ures.json();

        const me = await upsertUserFromSocial({
          provider: "google",
          providerUserId: String(prof.sub),
          email: prof.email ?? null,
          displayName: prof.name ?? null,
          avatarUrl: prof.picture ?? null,
          refreshTokenEnc: token.refresh_token ?? null,
        });
        if (!me) throw new Error("USER_UPSERT_FAILED");
        return me;
      }

      case "apple": {
        const p = endpoints.apple;
        const clientSecret = await createAppleClientSecret();

        const token = await postForm<{
          access_token: string;
          refresh_token?: string;
          id_token: string;
          token_type: string;
          expires_in: number;
        }>(p.token, {
          grant_type: "authorization_code",
          client_id: p.clientId,
          client_secret: clientSecret,
          redirect_uri: p.redirectUri,
          code,
          code_verifier: codeVerifier,
        }, ac.signal);

        // TODO: Apple id_token JWK 서명 검증(권장)
        const parts = token.id_token.split(".");
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        const sub = String(payload.sub);
        const email = payload.email ?? null;

        const me = await upsertUserFromSocial({
          provider: "apple",
          providerUserId: sub,
          email,
          displayName: null,
          avatarUrl: null,
          refreshTokenEnc: token.refresh_token ?? null,
        });
        if (!me) throw new Error("USER_UPSERT_FAILED");
        return me;
      }
    }
  } finally {
    clearTimeout(t);
  }
}
