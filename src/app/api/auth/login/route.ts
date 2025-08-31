// app/api/auth/login/route.ts

import { addPenalty, getClientIp, hitRateLimit } from "@/lib/rate-limit";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { issueSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAuthLog } from "@/lib/auth-log";

type LoginBody = { email?: string; password?: string };

const RL_OPT = { windowMs: 5 * 60 * 1000, max: 15, keyPrefix: "rl:login" as const };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? null;

  try {
    if (ip) {
      const rl = hitRateLimit(`ip:${ip}`, RL_OPT);
      if (!rl.ok) {
        await writeAuthLog({ provider: "password", result: "fail", reason: "rate_limit", ip, ua });
        return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } });
      }
    }

    const { email, password } = (await req.json()) as LoginBody;
    if (!email || !password) {
      if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1);
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRe.test(normalizedEmail)) {
      if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1);
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { userId: true, passwordHash: true } });
    if (!user?.passwordHash) {
      await writeAuthLog({ provider: "password", result: "fail", reason: "no_user_or_no_password", email: normalizedEmail, ip, ua });
      if (ip) addPenalty(`ip:${ip}`, RL_OPT, 2);
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await writeAuthLog({ provider: "password", result: "fail", reason: "bad_password", userId: user.userId, email: normalizedEmail, ip, ua });
      if (ip) addPenalty(`ip:${ip}`, RL_OPT, 2);
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await issueSession(user.userId);
    await writeAuthLog({ provider: "password", result: "success", userId: user.userId, email: normalizedEmail, ip, ua });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1);
    await writeAuthLog({ provider: "password", result: "fail", reason: "server_error", ip, ua });
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
