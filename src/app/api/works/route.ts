// app/api/works/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PageContentType, Prisma, WorkStatus } from "@prisma/client";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/* =========================
   Types
   ========================= */

type PageData = {
  type: "text" | "image" | "mixed";
  content: Prisma.InputJsonValue | null;
};

type DbPage = {
  pageId: string;
  workId: string;
  orderIndex: number;
  contentType: PageContentType;
  contentJson: Prisma.JsonValue;
};

type WorkWithPages = {
  workId: string;
  userId: string;
  title: string;
  coverImage: string | null;
  status: WorkStatus;
  createdAt: Date;
  updatedAt: Date;
  pages: DbPage[];
  _count: { pages: number };
};

/* =========================
   Helpers
   ========================= */

function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return {};
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return {};
  }
}

function getPageContentType(type: string): PageContentType {
  switch (type?.toLowerCase()) {
    case "text":
      return PageContentType.text;
    case "image":
      return PageContentType.image;
    case "mixed":
      return PageContentType.mixed;
    default:
      return PageContentType.text;
  }
}

function parseWorkStatus(input: unknown): WorkStatus | null {
  if (typeof input !== "string") return null;
  const v = input.toLowerCase();
  if (v === "draft") return WorkStatus.draft;
  if (v === "completed") return WorkStatus.completed;
  return null;
}

function transformWork(work: WorkWithPages) {
  return {
    id: work.workId,
    title: work.title,
    status: work.status, // 그대로(draft|completed)
    coverImage: work.coverImage,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    pages: work.pages.map((page) => ({
      id: page.pageId,
      type: page.contentType.toUpperCase(), // TEXT | IMAGE | MIXED
      order: page.orderIndex,
      content: page.contentJson,
    })),
    _count: work._count,
  };
}

/* =========================
   Handlers
   ========================= */

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");
    const parsedStatus = parseWorkStatus(rawStatus ?? undefined);

    const where: { userId: string; status?: WorkStatus } = { userId };
    if (parsedStatus) where.status = parsedStatus;

    const works = await prisma.work.findMany({
      where,
      include: {
        pages: { orderBy: { orderIndex: "asc" } },
        _count: { select: { pages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const transformed = works.map((w) => transformWork(w as unknown as WorkWithPages));
    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Get works error:", error);
    return NextResponse.json({ error: "Failed to fetch works" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const data = await request.json();

    const {
      title,
      coverImage,
      pages,
      status: rawStatus,
    }: { title?: string; coverImage?: string; pages?: PageData[]; status?: string } = data ?? {};

    const statusFromClient = parseWorkStatus(rawStatus ?? undefined);

    const work = await prisma.work.create({
      data: {
        userId,
        title: title || "새로운 작품",
        coverImage,
        status: statusFromClient ?? WorkStatus.draft,
      },
    });

    if (pages?.length) {
      const pageData = pages.map((page, index) => ({
        workId: work.workId,
        orderIndex: index,
        contentType: getPageContentType(page.type),
        contentJson: toInputJson(page.content),
      }));
      await prisma.page.createMany({ data: pageData });
    }

    const createdWork = await prisma.work.findUnique({
      where: { workId: work.workId },
      include: {
        pages: { orderBy: { orderIndex: "asc" } },
        _count: { select: { pages: true } },
      },
    });

    if (!createdWork) throw new Error("Failed to retrieve created work");
    return NextResponse.json(transformWork(createdWork as unknown as WorkWithPages));
  } catch (error) {
    console.error("Create work error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create work";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const data = await request.json();

    const {
      id,
      title,
      coverImage,
      pages,
      status: rawStatus,
    }: { id?: string; title?: string; coverImage?: string; pages?: PageData[]; status?: string } = data ?? {};

    if (!id) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    const existingWork = await prisma.work.findFirst({
      where: { workId: id, userId },
      select: { workId: true },
    });
    if (!existingWork) {
      return NextResponse.json(
        { error: "Work not found or unauthorized" },
        { status: 404 }
      );
    }

    const statusFromClient = parseWorkStatus(rawStatus ?? undefined);

    await prisma.$transaction(async (tx) => {
      await tx.work.update({
        where: { workId: id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
          ...(statusFromClient ? { status: statusFromClient } : {}),
          updatedAt: new Date(),
        },
      });

      // 페이지 전체 재생성
      await tx.page.deleteMany({ where: { workId: id } });

      if (pages?.length) {
        const pageData = pages.map((page, index) => ({
          workId: id,
          orderIndex: index,
          contentType: getPageContentType(page.type),
          contentJson: toInputJson(page.content),
        }));
        await tx.page.createMany({ data: pageData });
      }
    });

    const workWithPages = await prisma.work.findUnique({
      where: { workId: id },
      include: {
        pages: { orderBy: { orderIndex: "asc" } },
        _count: { select: { pages: true } },
      },
    });

    if (!workWithPages) throw new Error("Failed to retrieve updated work");
    return NextResponse.json(transformWork(workWithPages as unknown as WorkWithPages));
  } catch (error) {
    // 👇 Prisma/런타임 에러를 그대로 노출해 디버깅 용이
    console.error("Update work error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update work";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
