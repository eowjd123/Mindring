// app/api/export/[workId]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { workId: string };

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> } // ✅ params를 Promise로 고정
) {
  const { workId } = await context.params;            // ✅ Promise 해제
  if (!workId) {
    return NextResponse.json({ error: "WORK_ID_REQUIRED" }, { status: 400 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const work = await prisma.work.findUnique({
    where: { workId },
    include: { pages: { orderBy: { orderIndex: "asc" } } },
  });

  if (!work) {
    return NextResponse.json({ error: "WORK_NOT_FOUND" }, { status: 404 });
  }

  const payload = {
    id: work.workId,
    title: work.title,
    status: work.status.toUpperCase(),
    coverImage: work.coverImage ?? null,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    pages: work.pages.map((p) => ({
      id: p.pageId,
      type: String(p.contentType).toUpperCase() as "TEXT" | "IMAGE" | "MIXED",
      order: p.orderIndex,
      content: p.contentJson,
    })),
  };

  if (format !== "json") {
    return NextResponse.json(
      { error: "UNSUPPORTED_FORMAT", supported: ["json"] },
      { status: 400 }
    );
  }

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="work-${work.workId}.json"`,
    },
  });
}
