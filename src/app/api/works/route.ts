// app/api/works/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PageContentType, Prisma, WorkStatus } from "@prisma/client";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/* =========================
   Types
   ========================= */

// 프론트에서 받는 페이지 입력
type PageData = {
  type: "text" | "image" | "mixed";
  // JSON 입력 전용 타입 사용 (null 가능 → 유틸에서 {}로 치환)
  content: Prisma.InputJsonValue | null;
};

// DB에서 읽을 때의 Page 확장 타입
type DbPage = {
  pageId: string;
  workId: string;
  orderIndex: number;
  contentType: PageContentType;
  contentJson: Prisma.JsonValue;
};

// GET 응답 구성편의를 위한 타입
type WorkWithPages = {
  workId: string;
  userId: string;
  title: string;
  coverImage: string | null;
  status: WorkStatus;
  createdAt: Date;
  updatedAt: Date;
  pages: DbPage[];
  _count: {
    pages: number;
  };
};

// (옵션) 감정 매핑 타입 — 현재 스키마 Emotion ↔ 프론트 표시 형 변환용
type EmotionType = "VERY_HAPPY" | "HAPPY" | "NEUTRAL" | "SAD" | "VERY_SAD";

/* =========================
   Helpers
   ========================= */

// JSON 입력을 안전하게 정규화 (createMany에 넣기 전)
// - null/undefined → {}
// - 원시 타입 그대로 통과
// - 순환참조/Date/Map 등 직렬화 불가 객체 → JSON 직렬화 후 파싱
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

// 페이지 콘텐츠 유형 문자열 → PageContentType Enum
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

// (옵션) 스키마 Emotion 문자열 → 프론트 EmotionType
function mapEmotionToFrontend(emotion: string | null): EmotionType {
  if (!emotion) return "NEUTRAL";
  switch (emotion) {
    case "joy":
      return "VERY_HAPPY";
    case "surprise":
      return "HAPPY";
    case "neutral":
      return "NEUTRAL";
    case "sadness":
      return "SAD";
    case "anger":
    case "fear":
      return "VERY_SAD";
    default:
      return "NEUTRAL";
  }
}

// (옵션) 프론트 EmotionType → 스키마 Emotion 문자열
function mapEmotionToSchema(emotion: EmotionType): string {
  switch (emotion) {
    case "VERY_HAPPY":
      return "joy";
    case "HAPPY":
      return "surprise";
    case "NEUTRAL":
      return "neutral";
    case "SAD":
      return "sadness";
    case "VERY_SAD":
      return "anger";
    default:
      return "neutral";
  }
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

    // status가 유효한 enum 값일 때만 where에 추가
    const where: { userId: string; status?: WorkStatus } = { userId };
    if (rawStatus && Object.values(WorkStatus).includes(rawStatus as WorkStatus)) {
      where.status = rawStatus as WorkStatus;
    }

    const works = await prisma.work.findMany({
      where,
      include: {
        pages: {
          orderBy: { orderIndex: "asc" },
        },
        _count: { select: { pages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const transformed = works.map((work: WorkWithPages) => ({
      id: work.workId,
      title: work.title,
      status: work.status.toUpperCase(), // 'draft' -> 'DRAFT'
      coverImage: work.coverImage,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: work.pages.map((page: DbPage) => ({
        id: page.pageId,
        type: page.contentType.toUpperCase(), // 'text' -> 'TEXT'
        order: page.orderIndex,
        content: page.contentJson,
      })),
      _count: work._count,
    }));

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
    }: {
      title?: string;
      coverImage?: string;
      pages?: PageData[];
    } = data ?? {};

    // 작품 생성
    const work = await prisma.work.create({
      data: {
        userId,
        title: title || "새로운 작품",
        coverImage,
        status: WorkStatus.draft,
      },
    });

    // 페이지 생성 (있을 때만)
    if (pages && pages.length > 0) {
      const pageData: Array<{
        workId: string;
        orderIndex: number;
        contentType: PageContentType;
        contentJson: Prisma.InputJsonValue;
      }> = pages.map((page, index) => ({
        workId: work.workId,
        orderIndex: index,
        contentType: getPageContentType(page.type),
        contentJson: toInputJson(page.content),
      }));

      await prisma.page.createMany({ data: pageData });
    }

    // 생성된 결과 조회
    const createdWork = await prisma.work.findUnique({
      where: { workId: work.workId },
      include: { pages: { orderBy: { orderIndex: "asc" } } },
    });

    if (!createdWork) {
      throw new Error("Failed to retrieve created work");
    }

    const transformed = {
      id: createdWork.workId,
      title: createdWork.title,
      status: createdWork.status.toUpperCase(),
      coverImage: createdWork.coverImage,
      createdAt: createdWork.createdAt.toISOString(),
      updatedAt: createdWork.updatedAt.toISOString(),
      pages: createdWork.pages.map((page: DbPage) => ({
        id: page.pageId,
        type: page.contentType.toUpperCase(),
        order: page.orderIndex,
        content: page.contentJson,
      })),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Create work error:", error);
    return NextResponse.json({ error: "Failed to create work" }, { status: 500 });
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
    }: {
      id?: string;
      title?: string;
      coverImage?: string;
      pages?: PageData[];
    } = data ?? {};

    if (!id) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    // 소유권 확인
    const existingWork = await prisma.work.findFirst({
      where: { workId: id, userId },
      select: { workId: true },
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    // 트랜잭션: 작품 업데이트 + 페이지 재생성
    await prisma.$transaction(async (tx) => {
      await tx.work.update({
        where: { workId: id },
        data: {
          title,
          coverImage,
          updatedAt: new Date(),
        },
      });

      await tx.page.deleteMany({ where: { workId: id } });

      if (pages && pages.length > 0) {
        const pageData: Array<{
          workId: string;
          orderIndex: number;
          contentType: PageContentType;
          contentJson: Prisma.InputJsonValue;
        }> = pages.map((page, index) => ({
          workId: id,
          orderIndex: index,
          contentType: getPageContentType(page.type),
          contentJson: toInputJson(page.content),
        }));

        await tx.page.createMany({ data: pageData });
      }
    });

    // 갱신 결과 조회
    const workWithPages = await prisma.work.findUnique({
      where: { workId: id },
      include: { pages: { orderBy: { orderIndex: "asc" } } },
    });

    if (!workWithPages) {
      throw new Error("Failed to retrieve updated work");
    }

    const transformed = {
      id: workWithPages.workId,
      title: workWithPages.title,
      status: workWithPages.status.toUpperCase(),
      coverImage: workWithPages.coverImage,
      createdAt: workWithPages.createdAt.toISOString(),
      updatedAt: workWithPages.updatedAt.toISOString(),
      pages: workWithPages.pages.map((page: DbPage) => ({
        id: page.pageId,
        type: page.contentType.toUpperCase(),
        order: page.orderIndex,
        content: page.contentJson,
      })),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Update work error:", error);
    return NextResponse.json({ error: "Failed to update work" }, { status: 500 });
  }
}
