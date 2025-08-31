// lib/captcha.ts

export async function verifyTurnstile(token: string, remoteip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // 환경이 없으면 우회(개발용). 운영에선 false 권장

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteip) form.set("remoteip", remoteip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const j = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  return { ok: !!j.success, reason: j["error-codes"]?.[0] };
}

// (선택) reCAPTCHA v3 검증
export async function verifyReCaptcha(token: string, remoteip?: string | null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // 개발용
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteip) form.set("remoteip", remoteip);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    body: form,
  });

  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const j = await res.json();
  // v3는 score 기반(0.0~1.0). 임계치 0.5 예시.
  const scoreOk = typeof j.score === "number" ? j.score >= 0.5 : true;
  return { ok: !!j.success && scoreOk, reason: j["error-codes"]?.[0] ?? (scoreOk ? undefined : "low_score") };
}
