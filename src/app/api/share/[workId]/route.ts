// app/api/share/[workId]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

type Action = "get" | "enable" | "rotate" | "disable";
const isAction = (v: string | null): v is Action =>
  v === "get" || v === "enable" || v === "rotate" || v === "disable";

// workId = cuid() 25자 영숫자
const isCuid = (id: string) => /^[a-z0-9]{25}$/i.test(id);

function makeToken(): string {
  // 32자 hex → schema CHAR(32)와 일치
  return randomBytes(16).toString("hex");
}
function buildShareUrl(origin: string, workId: string, token: string) {
  const base = process.env.APP_URL ?? origin;
  return `${base}/share/${workId}?token=${token}`;
}

type Params = { workId: string };

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { workId } = await ctx.params; // ✅ Promise 해제
    if (!isCuid(workId)) {
      return NextResponse.json({ error: "INVALID_WORK_ID" }, { status: 400 });
    }

    const url = new URL(req.url);
    const act: Action = isAction(url.searchParams.get("action")) ? (url.searchParams.get("action") as Action) : "get";

    // 소유권 확인 및 현재 상태 조회
    const work = await prisma.work.findUnique({
      where: { workId },
      select: {
        workId: true,
        userId: true,
        shareToken: true,
        title: true,
        updatedAt: true,
      },
    });

    if (!work || work.userId !== user.userId) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    // ---- get ----
    if (act === "get") {
      const enabled = !!work.shareToken;
      return NextResponse.json({
        workId: work.workId,
        enabled,
        shareToken: work.shareToken ?? null,
        shareUrl:
          enabled && work.shareToken
            ? buildShareUrl(req.nextUrl.origin, work.workId, work.shareToken)
            : null,
        title: work.title,
        updatedAt: work.updatedAt.toISOString(),
      });
    }

    // ---- enable ----
    if (act === "enable") {
      if (work.shareToken) {
        return NextResponse.json({
          workId: work.workId,
          enabled: true,
          shareToken: work.shareToken,
          shareUrl: buildShareUrl(req.nextUrl.origin, work.workId, work.shareToken),
        });
      }
      const token = makeToken();
      const updated = await prisma.work.update({
        where: { workId },
        data: { shareToken: token, updatedAt: new Date() },
        select: { workId: true, shareToken: true },
      });
      return NextResponse.json({
        workId: updated.workId,
        enabled: true,
        shareToken: updated.shareToken,
        shareUrl: buildShareUrl(req.nextUrl.origin, updated.workId, updated.shareToken!),
      });
    }

    // ---- rotate ----
    if (act === "rotate") {
      const token = makeToken();
      const updated = await prisma.work.update({
        where: { workId },
        data: { shareToken: token, updatedAt: new Date() },
        select: { workId: true, shareToken: true },
      });
      return NextResponse.json({
        workId: updated.workId,
        enabled: true,
        shareToken: updated.shareToken,
        shareUrl: buildShareUrl(req.nextUrl.origin, updated.workId, updated.shareToken!),
      });
    }

    // ---- disable ----
    await prisma.work.update({
      where: { workId },
      data: { shareToken: null, updatedAt: new Date() },
      select: { workId: true },
    });
    return NextResponse.json({
      workId,
      enabled: false,
      shareToken: null,
      shareUrl: null,
    });
  } catch (err) {
    console.error("Share route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
