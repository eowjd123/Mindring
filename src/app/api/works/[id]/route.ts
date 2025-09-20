// app/api/works/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Prisma, WorkStatus } from "@prisma/client";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// cuid(25자 영숫자) 검사 — 필요 없으면 제거하세요
const isCuid = (id: string) => /^[a-z0-9]{25}$/i.test(id);

type Params = { id: string };

// 인쇄 사양 포함된 작품 타입
type WorkWithPrintSpec = {
  workId: string;
  userId: string;
  title: string;
  coverImage: string | null;
  status: WorkStatus;
  createdAt: Date;
  updatedAt: Date;
  pages: Array<{
    pageId: string;
    orderIndex: number;
    contentType: string;
    contentJson: Prisma.JsonValue;
  }>;
  printSpec: {
    specId: string;
    paperSize: string;
    coverType: string;
    innerPaper: string;
    orientation: string | null;
    additionalOptions: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  exports?: Array<{
    exportId: string;
    fileType: string;
    filePath: string;
    createdAt: Date;
  }>;
};

function transformWorkDetail(work: WorkWithPrintSpec) {
  return {
    id: work.workId,
    title: work.title,
    status: work.status.toLowerCase(), // 'draft' | 'completed'
    coverImage: work.coverImage,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    pages: work.pages.map((p) => ({
      id: p.pageId,
      type: p.contentType.toUpperCase(), // 'TEXT' | 'IMAGE' | 'MIXED'
      order: p.orderIndex,
      content: p.contentJson,
    })),
    printSpec: work.printSpec ? {
      specId: work.printSpec.specId,
      paperSize: work.printSpec.paperSize.toLowerCase(),
      coverType: work.printSpec.coverType.toLowerCase(),
      innerPaper: work.printSpec.innerPaper.toLowerCase(),
      orientation: work.printSpec.orientation || "portrait",
      additionalOptions: work.printSpec.additionalOptions,
      createdAt: work.printSpec.createdAt.toISOString(),
      updatedAt: work.printSpec.updatedAt.toISOString(),
    } : null,
    exports: work.exports?.map((e) => ({
      id: e.exportId,
      fileType: e.fileType,
      filePath: e.filePath,
      createdAt: e.createdAt.toISOString(),
    })) || [],
  };
}

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
      include: { 
        pages: { orderBy: { orderIndex: "asc" } },
        printSpec: true, // 인쇄 사양 포함
        exports: { 
          orderBy: { createdAt: "desc" },
          take: 10 // 최근 10개만
        }
      },
    });

    if (!work) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    const payload = transformWorkDetail(work as unknown as WorkWithPrintSpec);
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

    // 인쇄 주문이 있는지 확인
    const printOrders = await prisma.printOrder.findMany({
      where: { workId },
      select: { orderId: true, status: true },
    });

    // 진행 중인 인쇄 주문이 있으면 삭제 불가
    const activePrintOrders = printOrders.filter(order => 
      ['pending', 'processing'].includes(order.status.toLowerCase())
    );

    if (activePrintOrders.length > 0) {
      return NextResponse.json(
        { 
          error: "진행 중인 인쇄 주문이 있는 작품은 삭제할 수 없습니다",
          details: `${activePrintOrders.length}개의 활성 주문이 있습니다`
        }, 
        { status: 400 }
      );
    }

    // 트랜잭션으로 안전하게 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 완료된 인쇄 주문 삭제 (진행 중인 것은 위에서 체크함)
      await tx.printOrder.deleteMany({
        where: { workId, userId: me.userId },
      });

      // 2. 인쇄 사양 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
      await tx.printSpecification.deleteMany({
        where: { workId },
      });

      // 3. 내보내기 기록 삭제
      await tx.export.deleteMany({
        where: { workId },
      });

      // 4. 페이지 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
      await tx.page.deleteMany({
        where: { workId },
      });

      // 5. 작품 삭제
      const result = await tx.work.deleteMany({
        where: { workId, userId: me.userId }, // 본인 소유만 삭제
      });

      if (result.count === 0) {
        throw new Error("Work not found or unauthorized");
      }
    });

    return NextResponse.json({ 
      message: "작품이 성공적으로 삭제되었습니다",
      deletedPrintOrders: printOrders.length 
    });
  } catch (err) {
    console.error("Delete work error:", err);
    
    if (err instanceof Error) {
      if (err.message.includes("not found")) {
        return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    
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

    const body = await req.json() as { 
      status?: string;
      title?: string;
      coverImage?: string;
    };

    const updateData: Partial<{
      status: WorkStatus;
      title: string;
      coverImage: string | null;
      updatedAt: Date;
    }> = {
      updatedAt: new Date()
    };

    // 상태 업데이트
    if (body.status) {
      updateData.status = body.status.toLowerCase() === "completed" 
        ? WorkStatus.completed 
        : WorkStatus.draft;
    }

    // 제목 업데이트
    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    // 커버 이미지 업데이트
    if (body.coverImage !== undefined) {
      updateData.coverImage = body.coverImage || null;
    }

    const result = await prisma.work.updateMany({
      where: { workId, userId: me.userId },
      data: updateData,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    // 업데이트된 작품 조회
    const updatedWork = await prisma.work.findFirst({
      where: { workId, userId: me.userId },
      include: { 
        printSpec: true,
        _count: { select: { pages: true } }
      },
    });

    const response = {
      message: "작품이 성공적으로 업데이트되었습니다",
      work: updatedWork ? {
        id: updatedWork.workId,
        title: updatedWork.title,
        status: updatedWork.status.toLowerCase(),
        coverImage: updatedWork.coverImage,
        updatedAt: updatedWork.updatedAt.toISOString(),
        printSpec: updatedWork.printSpec ? {
          paperSize: updatedWork.printSpec.paperSize.toLowerCase(),
          coverType: updatedWork.printSpec.coverType.toLowerCase(),
          innerPaper: updatedWork.printSpec.innerPaper.toLowerCase(),
          orientation: updatedWork.printSpec.orientation || "portrait",
        } : null,
        pageCount: updatedWork._count.pages,
      } : null,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Update work error:", err);
    return NextResponse.json({ error: "Failed to update work" }, { status: 500 });
  }
}