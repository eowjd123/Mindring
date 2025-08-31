// app/api/works/[id]/pages/route.ts

import { PageContentType, Prisma } from "@prisma/client";

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// cuid(25자 영숫자)
const isCuid = (id: string) => /^[a-z0-9]{25}$/i.test(id);

// 문자열 → Enum 매핑
function toContentType(t?: string | PageContentType): PageContentType {
  if (!t) return PageContentType.text;
  if (typeof t !== "string") return t;
  switch (t.toLowerCase()) {
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

type Params = { id: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> } // ✅ Promise 컨텍스트
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await ctx.params; // ✅ Promise 해제
    if (!isCuid(id)) {
      return NextResponse.json({ error: "INVALID_WORK_ID" }, { status: 400 });
    }

    // 내 소유의 작품인지 확인
    const work = await prisma.work.findFirst({
      where: { workId: id, userId: me.userId },
      select: { workId: true },
    });
    if (!work) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const body = (await req.json()) as Partial<{
      orderIndex: number;
      contentType: PageContentType | "text" | "image" | "mixed";
      contentJson: unknown;
    }>;

    // orderIndex 유효성 체크 & 기본값: 마지막 다음 인덱스
    let orderIndex = Number.isInteger(body.orderIndex) && body.orderIndex! >= 0
      ? body.orderIndex!
      : await prisma.page.count({ where: { workId: work.workId } });

    const contentType = toContentType(body.contentType);
    const contentJson = toInputJson(body.contentJson);

    // unique([workId, orderIndex]) 충돌 방지: 이미 존재하면 뒤로 밀기
    const exists = await prisma.page.findFirst({
      where: { workId: work.workId, orderIndex },
      select: { pageId: true },
    });
    if (exists) {
      orderIndex = await prisma.page.count({ where: { workId: work.workId } });
    }

    // 트랜잭션: 페이지 생성 + 작품 updatedAt 갱신
    const created = await prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: { workId: work.workId, orderIndex, contentType, contentJson },
        select: {
          pageId: true,
          workId: true,
          orderIndex: true,
          contentType: true,
          contentJson: true,
        },
      });

      await tx.work.update({
        where: { workId: work.workId },
        data: { updatedAt: new Date() },
        select: { workId: true },
      });

      return page;
    });

    return NextResponse.json(
      {
        id: created.pageId,
        workId: created.workId,
        order: created.orderIndex,
        type: created.contentType.toUpperCase(), // 'TEXT' | 'IMAGE' | 'MIXED'
        content: created.contentJson,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create page error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
