// app/api/auth/signup/route.ts

import { addPenalty, getClientIp, hitRateLimit } from "@/lib/rate-limit";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { issueSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { writeAuthLog } from "@/lib/auth-log";

type Body = { email?: string; password?: string; confirm?: string; name?: string };

const RL_OPT = { windowMs: 5 * 60 * 1000, max: 15, keyPrefix: "rl:signup" as const };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const pwRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/u;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent") ?? null;

  try {
    if (ip) {
      const rl = hitRateLimit(`ip:${ip}`, RL_OPT);
      if (!rl.ok) {
        await writeAuthLog({ provider: "password", result: "fail", reason: "rate_limit_signup", ip, ua });
        return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } });
      }
    }

    const { email, password, confirm, name } = (await req.json()) as Body;

    const normalizedEmail = (email ?? "").trim().toLowerCase();
    if (!emailRe.test(normalizedEmail)) { if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1); return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 }); }
    if (!pwRe.test(password ?? "")) { if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1); return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 }); }
    if (password !== confirm) { if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1); return NextResponse.json({ error: "PASSWORD_MISMATCH" }, { status: 400 }); }

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { userId: true } });
    if (exists) { await writeAuthLog({ provider: "password", result: "fail", reason: "email_exists", email: normalizedEmail, ip, ua }); return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 }); }

    const hash = await bcrypt.hash(password!, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash: hash, name: (name ?? "").trim() || null, emailSavedFlag: true, passwordSavedFlag: true },
      select: { userId: true },
    });

    await issueSession(user.userId);
    await writeAuthLog({ provider: "password", result: "success", reason: "signup", userId: user.userId, email: normalizedEmail, ip, ua });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/auth/signup error:", e);
    if (ip) addPenalty(`ip:${ip}`, RL_OPT, 1);
    await writeAuthLog({ provider: "password", result: "fail", reason: "server_error_signup", ip, ua });
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
