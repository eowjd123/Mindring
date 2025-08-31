import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForProfile, isProvider } from "@/lib/oauth";

import { issueSession } from "@/lib/session";

type Params = { provider: string };

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> } // ✅ 정확히 Promise로 고정
) {
  const { provider } = await params;      // ✅ 런타임이 객체여도 await 안전

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "INVALID_CALLBACK" }, { status: 400 });
  }
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "UNSUPPORTED_PROVIDER" }, { status: 400 });
  }

  try {
    const user = await exchangeCodeForProfile(provider, { code, state });
    await issueSession(user.userId);

    const base = process.env.APP_URL ?? req.nextUrl.origin;
    return NextResponse.redirect(new URL("/dashboard", base));
  } catch (err) {
    console.error("OAuth callback error:", err);
    const base = process.env.APP_URL ?? req.nextUrl.origin;
    const redirect = new URL("/login", base);
    redirect.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(redirect);
  }
}
