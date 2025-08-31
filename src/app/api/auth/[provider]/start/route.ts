// app/api/auth/[provider]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAuthStartUrl, PROVIDERS, type Provider } from "@/lib/oauth";

const providerSet = new Set<string>(PROVIDERS as readonly string[]);
const isProvider = (p: string): p is Provider => providerSet.has(p);

type Params = { provider: string };

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> } // ✅ 정확히 Promise 로 고정
) {
  const { provider } = await params; // ✅ Next 타입 생성기 요구사항 충족

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "UNSUPPORTED_PROVIDER" }, { status: 400 });
  }

  try {
    const url = await createAuthStartUrl(provider);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("OAuth start error:", err);
    return NextResponse.json({ error: "OAUTH_START_FAILED" }, { status: 500 });
  }
}
