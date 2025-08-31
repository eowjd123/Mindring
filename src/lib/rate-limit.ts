// lib/rate-limit.ts
type WindowKey = string; // e.g. "login:ip:203.0.113.5"
type Bucket = { count: number; resetAt: number };

const store = new Map<WindowKey, Bucket>();

export type RateLimitOptions = {
  windowMs: number;      // 윈도우 길이 (ms)
  max: number;           // 허용 횟수
  keyPrefix?: string;    // 키 프리픽스
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function getClientIp(req: Request): string | null {
  // App Router Request (Edge/Node 모두 동작하도록 여러 헤더 고려)
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Node 런타임에선 req.socket 없음. 헤더가 없을 수 있음
  return null;
}

export function hitRateLimit(key: string, opt: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowKey = `${opt.keyPrefix ?? "rl"}:${key}`;

  let b = store.get(windowKey);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + opt.windowMs };
    store.set(windowKey, b);
  }
  b.count += 1;

  const ok = b.count <= opt.max;
  return { ok, remaining: Math.max(0, opt.max - b.count), resetAt: b.resetAt };
}

// (선택) 실패 시 가중치 부여용
export function addPenalty(key: string, opt: RateLimitOptions, weight = 1) {
  const now = Date.now();
  const windowKey = `${opt.keyPrefix ?? "rl"}:${key}`;
  let b = store.get(windowKey);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + opt.windowMs };
    store.set(windowKey, b);
  }
  b.count += weight;
}
