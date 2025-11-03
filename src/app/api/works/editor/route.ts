// app/api/works/editor/route.ts

import { CoverType, InnerPaper, PageContentType, PaperSize, Prisma, WorkStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 인터페이스 정의
interface RequestBodyPage {
  id: string;
  type: string;
  templateId?: string;
  content: Prisma.JsonValue;
}

interface RequestBodyPrintSpec {
  paperSize: string;
  coverType: string;
  innerPaper: string;
  orientation: string;
}

interface ValidatedBodyType {
  workId?: string;
  title: string;
  coverImage?: string;
  pages: RequestBodyPage[];
  printSpec?: RequestBodyPrintSpec;
}

// cuid 라이브러리가 없다면 간단한 25자 ID 생성 함수
const generateWorkId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2);
  const combined = timestamp + randomPart;
  
  // 25자로 제한하고 앞에 알파벳 문자 보장
  const id = 'w' + combined.substr(0, 24);
  return id;
};

// 페이지 타입을 Prisma enum에 맞게 변환하는 함수
const normalizePageType = (type: string): PageContentType => {
  const normalizedType = type.toLowerCase();
  switch (normalizedType) {
    case "text":
      return PageContentType.text;
    case "image":
      return PageContentType.image;
    case "mixed":
      return PageContentType.mixed;
    case "template":
      return PageContentType.mixed; // template 타입을 mixed로 매핑
    default:
      return PageContentType.text; // 기본값
  }
};

// 인쇄 사양 타입 변환 함수들
const normalizePaperSize = (value: string): PaperSize => {
  const normalizedValue = value.toUpperCase();
  if (normalizedValue === 'A4') return PaperSize.A4;
  if (normalizedValue === 'SHIN') return PaperSize.SHIN;
  return PaperSize.A4; // 기본값
};

const normalizeCoverType = (value: string): CoverType => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'soft_matte') return CoverType.soft_matte;
  if (normalizedValue === 'hard') return CoverType.hard;
  if (normalizedValue === 'none') return CoverType.none;
  return CoverType.soft_matte; // 기본값
};

const normalizeInnerPaper = (value: string): InnerPaper => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === 'plain') return InnerPaper.plain;
  if (normalizedValue === 'none') return InnerPaper.none;
  return InnerPaper.plain; // 기본값
};

// 작품 목록 조회 (에디터용)
export async function GET(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'draft' | 'completed' | null (전체)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 필터 조건 구성
    const whereCondition: {
      userId: string;
      status?: WorkStatus;
    } = {
      userId: me.userId,
    };

    if (status && ['draft', 'completed'].includes(status)) {
      whereCondition.status = status === 'completed' ? WorkStatus.completed : WorkStatus.draft;
    }

    const works = await prisma.work.findMany({
      where: whereCondition,
      include: {
        printSpec: true,
        _count: {
          select: { pages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.work.count({
      where: whereCondition,
    });

    const response = {
      works: works.map(work => ({
        id: work.workId,
        title: work.title,
        status: work.status.toLowerCase(),
        coverImage: work.coverImage,
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString(),
        pageCount: work._count.pages,
        printSpec: work.printSpec ? {
          paperSize: work.printSpec.paperSize.toLowerCase(),
          coverType: work.printSpec.coverType.toLowerCase(),
          innerPaper: work.printSpec.innerPaper.toLowerCase(),
          orientation: work.printSpec.orientation || "portrait",
        } : null,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      }
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error("Get works error:", err);
    return NextResponse.json({ error: "Failed to fetch works" }, { status: 500 });
  }
}

// 임시 작품 생성 또는 업데이트
export async function PATCH(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // 요청 본문 타입 검증 및 변환
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const rawBody = body as Record<string, unknown>;

    // 요청 본문 타입 정의 및 검증
    const validatedBody: ValidatedBodyType = {
      workId: typeof rawBody.workId === 'string' ? rawBody.workId : undefined,
      title: typeof rawBody.title === 'string' ? rawBody.title : "새로운 작품",
      coverImage: typeof rawBody.coverImage === 'string' ? rawBody.coverImage : undefined,
      pages: Array.isArray(rawBody.pages) ? rawBody.pages as RequestBodyPage[] : [],
      printSpec: rawBody.printSpec && typeof rawBody.printSpec === 'object' ? rawBody.printSpec as RequestBodyPrintSpec : undefined,
    };

    // pages 배열 내 요소들 검증 및 ID 길이 확인
    const pages = validatedBody.pages.filter(page => {
      if (!page || 
          typeof page.id !== 'string' || 
          typeof page.type !== 'string' || 
          page.content === undefined ||
          page.id.length > 25) { // ID 길이 제한 확인
        console.warn('유효하지 않은 페이지 데이터:', page);
        return false;
      }
      return true;
    });

    console.log('요청 데이터:', {
      workId: validatedBody.workId,
      title: validatedBody.title,
      pagesCount: pages.length,
      userId: me.userId
    });

    let work;

    // workId가 'editor'이거나 유효하지 않은 경우 새 작품 생성
    if (!validatedBody.workId || validatedBody.workId === 'editor' || validatedBody.workId.startsWith('temp-')) {
      console.log('새 작품 생성 시도');
      
      // 새 작품 생성 - 25자 이내의 고유 ID 생성
      const newWorkId = generateWorkId();
      
      console.log('생성할 작품 ID:', newWorkId);
      
      work = await prisma.$transaction(async (tx) => {
        // 1. 작품 생성
        const newWork = await tx.work.create({
          data: {
            workId: newWorkId,
            userId: me.userId,
            title: validatedBody.title,
            coverImage: validatedBody.coverImage || null,
            status: WorkStatus.draft,
          },
        });

        console.log('새 작품 생성됨:', newWork.workId); // 디버깅용

        // 2. 페이지 생성 (작품이 생성된 후이므로 안전)
        if (pages.length > 0) {
          console.log('페이지 생성 중:', pages.length, '개'); // 디버깅용
          
          await tx.page.createMany({
            data: pages.map((page, index) => ({
              pageId: page.id,
              workId: newWork.workId, // 생성된 작품의 ID 사용
              orderIndex: index,
              contentType: normalizePageType(page.type),
              contentJson: page.content as Prisma.InputJsonValue,
            })),
          });
        }

        // 3. 인쇄 사양 생성
        if (validatedBody.printSpec) {
          await tx.printSpecification.create({
            data: {
              workId: newWork.workId, // 생성된 작품의 ID 사용
              paperSize: normalizePaperSize(validatedBody.printSpec.paperSize),
              coverType: normalizeCoverType(validatedBody.printSpec.coverType),
              innerPaper: normalizeInnerPaper(validatedBody.printSpec.innerPaper),
              orientation: validatedBody.printSpec.orientation || "portrait",
            },
          });
        }

        // 4. 생성된 작품 반환
        return await tx.work.findFirst({
          where: { workId: newWork.workId, userId: me.userId },
          include: {
            pages: { orderBy: { orderIndex: "asc" } },
            printSpec: true,
          },
        });
      });
    } else {
      console.log('기존 작품 업데이트 시도:', validatedBody.workId);
      
      // 기존 작품 업데이트
      work = await prisma.$transaction(async (tx) => {
        // 1. 작품이 존재하는지 먼저 확인
        const existingWork = await tx.work.findFirst({
          where: { workId: validatedBody.workId, userId: me.userId }
        });

        console.log('기존 작품 조회 결과:', existingWork ? '찾음' : '없음');

        if (!existingWork) {
          throw new Error("작품을 찾을 수 없거나 권한이 없습니다.");
        }

        // 2. 작품 정보 업데이트
        await tx.work.updateMany({
          where: { workId: validatedBody.workId, userId: me.userId },
          data: {
            title: validatedBody.title,
            coverImage: validatedBody.coverImage || null,
            updatedAt: new Date(),
          },
        });

        // 3. 기존 페이지 삭제
        await tx.page.deleteMany({
          where: { workId: validatedBody.workId },
        });

        // 4. 새 페이지 생성 (작품이 존재함을 확인했으므로 안전)
        if (pages.length > 0) {
          await tx.page.createMany({
            data: pages.map((page, index) => ({
              pageId: page.id,
              workId: validatedBody.workId!,
              orderIndex: index,
              contentType: normalizePageType(page.type),
              contentJson: page.content as Prisma.InputJsonValue,
            })),
          });
        }

        // 5. 인쇄 사양 업데이트
        if (validatedBody.printSpec) {
          await tx.printSpecification.upsert({
            where: { workId: validatedBody.workId },
            create: {
              workId: validatedBody.workId!,
              paperSize: normalizePaperSize(validatedBody.printSpec.paperSize),
              coverType: normalizeCoverType(validatedBody.printSpec.coverType),
              innerPaper: normalizeInnerPaper(validatedBody.printSpec.innerPaper),
              orientation: validatedBody.printSpec.orientation || "portrait",
            },
            update: {
              paperSize: normalizePaperSize(validatedBody.printSpec.paperSize),
              coverType: normalizeCoverType(validatedBody.printSpec.coverType),
              innerPaper: normalizeInnerPaper(validatedBody.printSpec.innerPaper),
              orientation: validatedBody.printSpec.orientation || "portrait",
              updatedAt: new Date(),
            },
          });
        }

        // 6. 업데이트된 작품 반환
        return await tx.work.findFirst({
          where: { workId: validatedBody.workId, userId: me.userId },
          include: {
            pages: { orderBy: { orderIndex: "asc" } },
            printSpec: true,
          },
        });
      });
    }

    if (!work) {
      return NextResponse.json({ error: "Work not found or unauthorized" }, { status: 404 });
    }

    // 응답 데이터 변환
    const response = {
      id: work.workId,
      title: work.title,
      status: work.status.toLowerCase(),
      coverImage: work.coverImage,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: work.pages.map((p) => ({
        id: p.pageId,
        type: p.contentType.toLowerCase(),
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
      } : null,
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error("Update work error:", err);
    
    if (err instanceof Error) {
      // 구체적인 오류 메시지 제공
      if (err.message.includes("not found")) {
        return NextResponse.json({ 
          error: "작품을 찾을 수 없습니다", 
          details: "해당 작품이 존재하지 않거나 권한이 없습니다.",
          code: "WORK_NOT_FOUND"
        }, { status: 404 });
      }
      
      if (err.message.includes("Foreign key constraint")) {
        return NextResponse.json({ 
          error: "데이터 관계 오류", 
          details: "작품과 페이지 간의 관계에 문제가 있습니다.",
          code: "FOREIGN_KEY_ERROR"
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: "작품 저장 실패", 
        details: err.message,
        code: "SAVE_ERROR"
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "알 수 없는 오류가 발생했습니다", 
      details: "서버에서 예상치 못한 오류가 발생했습니다.",
      code: "UNKNOWN_ERROR"
    }, { status: 500 });
  }
}

// 임시 작품 생성
export async function POST(req: NextRequest) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rawBody = await req.json() as Record<string, unknown>;
    
    const body = {
      title: typeof rawBody.title === 'string' ? rawBody.title : undefined,
      template: typeof rawBody.template === 'string' ? rawBody.template : undefined,
      printSpec: rawBody.printSpec && typeof rawBody.printSpec === 'object' ? rawBody.printSpec as RequestBodyPrintSpec : undefined,
    };

    const newWorkId = generateWorkId();
    
    const work = await prisma.$transaction(async (tx) => {
      // 1. 작품 생성
      const newWork = await tx.work.create({
        data: {
          workId: newWorkId,
          userId: me.userId,
          title: body.title || "새로운 작품",
          status: WorkStatus.draft,
        },
      });

      // 2. 인쇄 사양 생성
      if (body.printSpec) {
        await tx.printSpecification.create({
          data: {
            workId: newWorkId,
            paperSize: normalizePaperSize(body.printSpec.paperSize),
            coverType: normalizeCoverType(body.printSpec.coverType),
            innerPaper: normalizeInnerPaper(body.printSpec.innerPaper),
            orientation: body.printSpec.orientation || "portrait",
          },
        });
      }

      return newWork;
    });

    const response = {
      id: work.workId,
      title: work.title,
      status: work.status.toLowerCase(),
      coverImage: work.coverImage,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: [],
      printSpec: body.printSpec ? {
        paperSize: body.printSpec.paperSize.toLowerCase(),
        coverType: body.printSpec.coverType.toLowerCase(),
        innerPaper: body.printSpec.innerPaper.toLowerCase(),
        orientation: body.printSpec.orientation || "portrait",
      } : null,
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error("Create work error:", err);
    return NextResponse.json({ error: "Failed to create work" }, { status: 500 });
  }
}