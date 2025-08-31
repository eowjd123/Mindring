import { exchangeCodeForProfile, isProvider } from "@/lib/oauth";

import { NextResponse } from "next/server";
import { issueSession } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "INVALID_CALLBACK" }, { status: 400 });
  }
  if (!isProvider(params.provider)) {
    return NextResponse.json({ error: "UNSUPPORTED_PROVIDER" }, { status: 400 });
  }

  try {
    const user = await exchangeCodeForProfile(params.provider, { code, state }); // Promise<User>
    await issueSession(user.userId);
    return NextResponse.redirect(process.env.APP_URL! + "/dashboard");
  } catch (err) {
    console.error("OAuth callback error:", err);
    const redirect = new URL("/login", process.env.APP_URL);
    redirect.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(redirect.toString());
  }
}
