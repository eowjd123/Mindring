// app/api/works/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { WorkStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// cuid(25자 영숫자) 검사 — 필요 없으면 제거하세요
const isCuid = (id: string) => /^[a-z0-9]{25}$/i.test(id);

type Params = { id: string };

/* ---------------- GET ---------------- */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> } // 👈 Promise로 받기
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await context.params; // 👈 Promise 해제
    if (!isCuid(workId)) {
      return NextResponse.json({ error: "INVALID_WORK_ID" }, { status: 400 });
    }

    const work = await prisma.work.findFirst({
      where: { workId, userId: me.userId },
      include: { pages: { orderBy: { orderIndex: "asc" } } },
    });

    if (!work) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    const payload = {
      id: work.workId,
      title: work.title,
      status: work.status.toUpperCase(), // 'DRAFT' | 'COMPLETED'
      coverImage: work.coverImage,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: work.pages.map((p) => ({
        id: p.pageId,
        type: p.contentType.toUpperCase(), // 'TEXT' | 'IMAGE' | 'MIXED'
        order: p.orderIndex,
        content: p.contentJson,
      })),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Get work error:", err);
    return NextResponse.json({ error: "Failed to fetch work" }, { status: 500 });
  }
}

/* --------------- DELETE --------------- */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> } // 👈 Promise
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await context.params;
    if (!isCuid(workId)) {
      return NextResponse.json({ error: "INVALID_WORK_ID" }, { status: 400 });
    }

    const result = await prisma.work.deleteMany({
      where: { workId, userId: me.userId }, // 본인 소유만 삭제
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Work deleted successfully" });
  } catch (err) {
    console.error("Delete work error:", err);
    return NextResponse.json({ error: "Failed to delete work" }, { status: 500 });
  }
}

/* ---------------- PATCH ---------------- */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<Params> } // 👈 Promise
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await context.params;
    if (!isCuid(workId)) {
      return NextResponse.json({ error: "INVALID_WORK_ID" }, { status: 400 });
    }

    const { status } = (await req.json()) as { status?: string };

    const newStatus: WorkStatus =
      status?.toLowerCase() === "completed" ? WorkStatus.completed : WorkStatus.draft;

    const result = await prisma.work.updateMany({
      where: { workId, userId: me.userId },
      data: { status: newStatus, updatedAt: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Work status updated successfully",
      status: newStatus, // 'draft' | 'completed'
    });
  } catch (err) {
    console.error("Update work status error:", err);
    return NextResponse.json({ error: "Failed to update work status" }, { status: 500 });
  }
}
