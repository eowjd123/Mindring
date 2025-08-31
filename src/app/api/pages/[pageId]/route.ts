// app/api/pages/[pageId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PageContentType, Prisma } from "@prisma/client";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// cuid(25자 영숫자) 검증
const isCuid = (id: string) => /^[a-z0-9]{25}$/i.test(id);

// 문자열 → Enum
function toContentType(t?: string): PageContentType {
  switch ((t ?? "").toLowerCase()) {
    case "image":
      return PageContentType.image;
    case "mixed":
      return PageContentType.mixed;
    default:
      return PageContentType.text;
  }
}

// JSON 입력 정규화
function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value == null) return {};
  if (["string", "number", "boolean"].includes(typeof value)) {
    return value as Prisma.InputJsonValue;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return {};
  }
}

// 안전한 정수 변환(음수 방지)
const toNonNegInt = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const r = Math.max(0, Math.trunc(v));
  return r;
};

type Params = { pageId: string };

/* ---------------- GET ---------------- */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<Params> } // ✅ Promise 시그니처
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { pageId } = await ctx.params; // ✅ await로 해제
    if (!isCuid(pageId)) {
      return NextResponse.json({ success: false, error: "Invalid page id" }, { status: 400 });
    }

    const page = await prisma.page.findFirst({
      where: { pageId, work: { userId: user.userId } },
      select: {
        pageId: true,
        workId: true,
        orderIndex: true,
        contentType: true,
        contentJson: true,
      },
    });

    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      page: {
        id: page.pageId,
        workId: page.workId,
        order: page.orderIndex,
        type: (page.contentType.toUpperCase() as "TEXT" | "IMAGE" | "MIXED"),
        content: page.contentJson,
      },
    });
  } catch (err) {
    console.error("GET /api/pages/[pageId] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/* ---------------- PUT ---------------- */
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<Params> } // ✅ Promise 시그니처
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { pageId } = await ctx.params; // ✅ await로 해제
    if (!isCuid(pageId)) {
      return NextResponse.json({ success: false, error: "Invalid page id" }, { status: 400 });
    }

    // 소유권 확인
    const owns = await prisma.page.findFirst({
      where: { pageId, work: { userId: user.userId } },
      select: { pageId: true },
    });
    if (!owns) {
      return NextResponse.json({ success: false, error: "Page not found or unauthorized" }, { status: 404 });
    }

    const body = (await req.json()) as Partial<{
      type: "text" | "image" | "mixed";
      content: unknown;
      order: number;
    }>;

    const data: Prisma.PageUpdateInput = {};
    if (body.type) data.contentType = toContentType(body.type);
    if (body.content !== undefined) data.contentJson = toInputJson(body.content);

    if (body.order !== undefined) {
      const ord = toNonNegInt(body.order);
      if (ord === null) {
        return NextResponse.json({ success: false, error: "Invalid order value" }, { status: 400 });
      }
      data.orderIndex = ord;
    }

    // Page에는 updatedAt이 없으므로 Work.updatedAt만 갱신
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.page.update({
        where: { pageId },
        data,
        select: {
          pageId: true,
          workId: true,
          orderIndex: true,
          contentType: true,
          contentJson: true,
        },
      });
      await tx.work.update({
        where: { workId: p.workId },
        data: { updatedAt: new Date() },
        select: { workId: true },
      });
      return p;
    });

    return NextResponse.json({
      success: true,
      page: {
        id: updated.pageId,
        workId: updated.workId,
        order: updated.orderIndex,
        type: (updated.contentType.toUpperCase() as "TEXT" | "IMAGE" | "MIXED"),
        content: updated.contentJson,
      },
    });
  } catch (err) {
    console.error("PUT /api/pages/[pageId] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/* --------------- DELETE --------------- */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> } // ✅ Promise 시그니처
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { pageId } = await ctx.params; // ✅ await로 해제
    if (!isCuid(pageId)) {
      return NextResponse.json({ success: false, error: "Invalid page id" }, { status: 400 });
    }

    // 삭제 전에 workId 조회 → Work.updatedAt 갱신
    const page = await prisma.page.findFirst({
      where: { pageId, work: { userId: user.userId } },
      select: { workId: true },
    });
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found or unauthorized" }, { status: 404 });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const del = await tx.page.deleteMany({
        where: { pageId, work: { userId: user.userId } },
      });
      await tx.work.update({
        where: { workId: page.workId },
        data: { updatedAt: new Date() },
        select: { workId: true },
      });
      return del.count;
    });

    if (deleted === 0) {
      return NextResponse.json({ success: false, error: "Page not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("DELETE /api/pages/[pageId] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
