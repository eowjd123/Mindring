// app/api/auth/[provider]/start/route.ts
import { NextResponse } from "next/server";
import { createAuthStartUrl, PROVIDERS, type Provider } from "@/lib/oauth";

function isProvider(p: string): p is Provider {
  return (PROVIDERS as readonly string[]).includes(p);
}

export async function GET(
  _req: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "UNSUPPORTED_PROVIDER" }, { status: 400 });
  }

  const url = await createAuthStartUrl(provider); // ✅ provider가 Provider로 좁혀짐
  return NextResponse.redirect(url);
}