// app/api/works/route.ts

import { CoverType, InnerPaper, PageContentType, PaperSize, Prisma, WorkStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/* =========================
   Types
   ========================= */

// 페이지 콘텐츠 타입 정의
interface PageContentData {
  type: 'text' | 'image' | 'mixed';
  text?: string;
  imageUrl?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  imagePosition?: 'top' | 'bottom' | 'left' | 'right';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
  orientation?: 'portrait' | 'landscape';
}

type PageData = {
  type: "text" | "image" | "mixed";
  content: PageContentData | null;
};

// 인쇄 사양 추가 옵션 타입
interface PrintAdditionalOptions {
  specialCoating?: boolean;
  bindingType?: 'perfect' | 'saddle' | 'spiral';
  laminationType?: 'matte' | 'gloss' | 'none';
  customInstructions?: string;
  [key: string]: string | number | boolean | undefined;
}

type PrintSpecData = {
  paperSize?: "A4" | "SHIN";
  coverType?: "soft_matte" | "hard" | "none";
  innerPaper?: "plain" | "none";
  orientation?: "portrait" | "landscape";
  additionalOptions?: PrintAdditionalOptions;
};

// 요청 본문 타입
interface CreateWorkRequest {
  title?: string;
  coverImage?: string;
  pages?: PageData[];
  status?: string;
  printSpec?: PrintSpecData;
}

interface UpdateWorkRequest extends CreateWorkRequest {
  id: string;
}

type DbPage = {
  pageId: string;
  workId: string;
  orderIndex: number;
  contentType: PageContentType;
  contentJson: Prisma.JsonValue;
};

type DbPrintSpec = {
  specId: string;
  workId: string;
  paperSize: PaperSize;
  coverType: CoverType;
  innerPaper: InnerPaper;
  orientation: string | null;
  additionalOptions: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
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
  printSpec: DbPrintSpec | null;
  _count: { pages: number };
};

// 응답 타입
interface WorkResponse {
  id: string;
  title: string;
  status: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  pages: Array<{
    id: string;
    type: string;
    order: number;
    content: Prisma.JsonValue;
  }>;
  printSpec: {
    specId: string;
    paperSize: string;
    coverType: string;
    innerPaper: string;
    orientation: string;
    additionalOptions: Prisma.JsonValue | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  _count: { pages: number };
}

/* =========================
   Helpers
   ========================= */

function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return {};
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      return {};
    }
  }
  return {};
}

function toNullableInputJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
      return Prisma.JsonNull;
    }
  }
  return Prisma.JsonNull;
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

function parsePaperSize(input: unknown): PaperSize {
  if (typeof input === "string") {
    const v = input.toUpperCase();
    if (v === "SHIN") return PaperSize.SHIN;
  }
  return PaperSize.A4; // 기본값
}

function parseCoverType(input: unknown): CoverType {
  if (typeof input === "string") {
    const v = input.toLowerCase();
    if (v === "hard") return CoverType.hard;
    if (v === "none") return CoverType.none;
  }
  return CoverType.soft_matte; // 기본값
}

function parseInnerPaper(input: unknown): InnerPaper {
  if (typeof input === "string") {
    const v = input.toLowerCase();
    if (v === "none") return InnerPaper.none;
  }
  return InnerPaper.plain; // 기본값
}

function isValidPrintAdditionalOptions(value: unknown): value is PrintAdditionalOptions {
  return typeof value === "object" && value !== null;
}

function transformWork(work: WorkWithPages): WorkResponse {
  return {
    id: work.workId,
    title: work.title,
    status: work.status.toLowerCase(), // draft|completed
    coverImage: work.coverImage,
    createdAt: work.createdAt.toISOString(),
    updatedAt: work.updatedAt.toISOString(),
    pages: work.pages.map((page) => ({
      id: page.pageId,
      type: page.contentType.toUpperCase(), // TEXT | IMAGE | MIXED
      order: page.orderIndex,
      content: page.contentJson,
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
    _count: work._count,
  };
}

/* =========================
   Validation Functions
   ========================= */

function validateCreateWorkRequest(data: unknown): data is CreateWorkRequest {
  if (typeof data !== "object" || data === null) return false;
  
  const request = data as Record<string, unknown>;
  
  // title 검증
  if (request.title !== undefined && typeof request.title !== "string") return false;
  
  // coverImage 검증
  if (request.coverImage !== undefined && typeof request.coverImage !== "string") return false;
  
  // status 검증
  if (request.status !== undefined && typeof request.status !== "string") return false;
  
  // pages 검증
  if (request.pages !== undefined) {
    if (!Array.isArray(request.pages)) return false;
    for (const page of request.pages) {
      if (typeof page !== "object" || page === null) return false;
      const pageData = page as Record<string, unknown>;
      if (typeof pageData.type !== "string") return false;
      if (!["text", "image", "mixed"].includes(pageData.type)) return false;
    }
  }
  
  // printSpec 검증
  if (request.printSpec !== undefined) {
    if (typeof request.printSpec !== "object" || request.printSpec === null) return false;
    const printSpec = request.printSpec as Record<string, unknown>;
    
    if (printSpec.paperSize !== undefined && !["A4", "SHIN"].includes(printSpec.paperSize as string)) return false;
    if (printSpec.coverType !== undefined && !["soft_matte", "hard", "none"].includes(printSpec.coverType as string)) return false;
    if (printSpec.innerPaper !== undefined && !["plain", "none"].includes(printSpec.innerPaper as string)) return false;
    if (printSpec.orientation !== undefined && !["portrait", "landscape"].includes(printSpec.orientation as string)) return false;
  }
  
  return true;
}

function validateUpdateWorkRequest(data: unknown): data is UpdateWorkRequest {
  if (!validateCreateWorkRequest(data)) return false;
  
  const request = data as Record<string, unknown>;
  return typeof request.id === "string" && request.id.length > 0;
}

/* =========================
   Handlers
   ========================= */

export async function GET(request: NextRequest): Promise<NextResponse<WorkResponse[] | { error: string }>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");
    const parsedStatus = parseWorkStatus(rawStatus);

    const where: { userId: string; status?: WorkStatus } = { userId };
    if (parsedStatus) where.status = parsedStatus;

    const works = await prisma.work.findMany({
      where,
      include: {
        pages: { orderBy: { orderIndex: "asc" } },
        printSpec: true,
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

export async function POST(request: NextRequest): Promise<NextResponse<WorkResponse | { error: string }>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const data: unknown = await request.json();

    // 입력값 검증
    if (!validateCreateWorkRequest(data)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { title, coverImage, pages, status: rawStatus, printSpec } = data;
    const statusFromClient = parseWorkStatus(rawStatus);

    // 트랜잭션으로 작품과 인쇄 사양을 함께 생성
    const result = await prisma.$transaction(async (tx) => {
      // 1. 작품 생성
      const work = await tx.work.create({
        data: {
          userId,
          title: title || "새로운 작품",
          coverImage,
          status: statusFromClient ?? WorkStatus.draft,
        },
      });

      // 2. 페이지 생성
      if (pages?.length) {
        const pageData = pages.map((page, index) => ({
          workId: work.workId,
          orderIndex: index,
          contentType: getPageContentType(page.type),
          contentJson: toInputJson(page.content),
        }));
        await tx.page.createMany({ data: pageData });
      }

      // 3. 인쇄 사양 생성 (있는 경우)
      if (printSpec) {
        await tx.printSpecification.create({
          data: {
            workId: work.workId,
            paperSize: parsePaperSize(printSpec.paperSize),
            coverType: parseCoverType(printSpec.coverType),
            innerPaper: parseInnerPaper(printSpec.innerPaper),
            orientation: printSpec.orientation || "portrait",
            additionalOptions: printSpec.additionalOptions && isValidPrintAdditionalOptions(printSpec.additionalOptions) 
              ? toNullableInputJson(printSpec.additionalOptions) 
              : Prisma.JsonNull,
          },
        });
      }

      // 4. 생성된 작품 전체 조회
      const createdWork = await tx.work.findUnique({
        where: { workId: work.workId },
        include: {
          pages: { orderBy: { orderIndex: "asc" } },
          printSpec: true,
          _count: { select: { pages: true } },
        },
      });

      return createdWork;
    });

    if (!result) throw new Error("Failed to retrieve created work");
    return NextResponse.json(transformWork(result as unknown as WorkWithPages));
  } catch (error) {
    console.error("Create work error:", error);
    const message = error instanceof Error ? error.message : "Failed to create work";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<WorkResponse | { error: string }>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.userId;
    const data: unknown = await request.json();

    // 입력값 검증
    if (!validateUpdateWorkRequest(data)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { id, title, coverImage, pages, status: rawStatus, printSpec } = data;

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

    const statusFromClient = parseWorkStatus(rawStatus);

    // 트랜잭션으로 작품과 인쇄 사양을 함께 수정
    await prisma.$transaction(async (tx) => {
      // 1. 작품 수정
      await tx.work.update({
        where: { workId: id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
          ...(statusFromClient ? { status: statusFromClient } : {}),
          updatedAt: new Date(),
        },
      });

      // 2. 페이지 전체 재생성
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

      // 3. 인쇄 사양 수정/생성
      if (printSpec) {
        await tx.printSpecification.upsert({
          where: { workId: id },
          update: {
            paperSize: parsePaperSize(printSpec.paperSize),
            coverType: parseCoverType(printSpec.coverType),
            innerPaper: parseInnerPaper(printSpec.innerPaper),
            orientation: printSpec.orientation || "portrait",
            additionalOptions: printSpec.additionalOptions && isValidPrintAdditionalOptions(printSpec.additionalOptions)
              ? toNullableInputJson(printSpec.additionalOptions)
              : Prisma.JsonNull,
            updatedAt: new Date(),
          },
          create: {
            workId: id,
            paperSize: parsePaperSize(printSpec.paperSize),
            coverType: parseCoverType(printSpec.coverType),
            innerPaper: parseInnerPaper(printSpec.innerPaper),
            orientation: printSpec.orientation || "portrait",
            additionalOptions: printSpec.additionalOptions && isValidPrintAdditionalOptions(printSpec.additionalOptions)
              ? toNullableInputJson(printSpec.additionalOptions)
              : Prisma.JsonNull,
          },
        });
      }
    });

    const workWithPages = await prisma.work.findUnique({
      where: { workId: id },
      include: {
        pages: { orderBy: { orderIndex: "asc" } },
        printSpec: true,
        _count: { select: { pages: true } },
      },
    });

    if (!workWithPages) throw new Error("Failed to retrieve updated work");
    return NextResponse.json(transformWork(workWithPages as unknown as WorkWithPages));
  } catch (error) {
    console.error("Update work error:", error);
    const message = error instanceof Error ? error.message : "Failed to update work";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}