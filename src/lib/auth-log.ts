// lib/auth-log.ts

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

function hashEmail(email: string) {
  // SHA-256 + hex (salt가 필요하면 환경변수로 추가)
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

type LogInput = {
  provider: string;             // 'password' | 'kakao' | ...
  result: "success" | "fail";
  reason?: string;              // 'no_user' | 'bad_password' | 'rate_limit' | 'captcha'
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  ua?: string | null;
};

export async function writeAuthLog(input: LogInput) {
  const emailHash = input.email ? hashEmail(input.email) : null;
  await prisma.authLog.create({
    data: {
      provider: input.provider,
      result: input.result,
      reason: input.reason,
      userId: input.userId ?? null,
      emailHash,
      ip: input.ip ?? null,
      ua: input.ua ?? null,
    },
  });
}
