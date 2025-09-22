// app/api/works/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { WorkStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 개별 작품 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await params;
    
    if (!workId) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    console.log('작품 조회 요청:', workId, '사용자:', me.userId);

    // 작품 조회 (소유자 확인 포함)
    const work = await prisma.work.findFirst({
      where: {
        workId: workId,
        userId: me.userId // 소유자만 조회 가능
      },
      include: {
        pages: {
          orderBy: { orderIndex: "asc" }
        },
        printSpec: true,
        exports: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!work) {
      console.log('작품을 찾을 수 없음:', workId);
      return NextResponse.json({ 
        error: "Work not found", 
        message: "작품을 찾을 수 없거나 접근 권한이 없습니다." 
      }, { status: 404 });
    }

    console.log('작품 조회 성공:', work.workId, '페이지 수:', work.pages.length);

    // 응답 데이터 변환
    const response = {
      id: work.workId,
      title: work.title,
      status: work.status.toLowerCase(),
      coverImage: work.coverImage,
      coverTemplateId: work.coverTemplateId || undefined,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: work.pages.map((page) => {
        // JSON 데이터를 올바르게 파싱
        let content;
        try {
          content = typeof page.contentJson === 'string' 
            ? JSON.parse(page.contentJson) 
            : page.contentJson;
        } catch (error) {
          console.error('페이지 내용 파싱 오류:', error);
          content = {};
        }

        return {
          id: page.pageId,
          type: page.contentType.toLowerCase(),
          templateId: undefined, // 템플릿 ID는 페이지 테이블에 없으므로 undefined
          content: content,
          order: page.orderIndex,
        };
      }),
      printSpec: work.printSpec ? {
        specId: work.printSpec.specId,
        paperSize: work.printSpec.paperSize.toLowerCase(),
        coverType: work.printSpec.coverType.toLowerCase(),
        innerPaper: work.printSpec.innerPaper.toLowerCase(),
        orientation: work.printSpec.orientation || "portrait",
        additionalOptions: work.printSpec.additionalOptions,
      } : null,
      exports: work.exports?.map((exp) => ({
        id: exp.exportId,
        fileType: exp.fileType,
        filePath: exp.filePath,
        createdAt: exp.createdAt.toISOString(),
      })) || [],
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error("Get work error:", err);
    
    if (err instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to fetch work", 
        details: err.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Unknown error occurred" 
    }, { status: 500 });
  }
}

// 작품 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await params;
    const body = await req.json();

    if (!workId) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    console.log('작품 업데이트 요청:', workId, body);

    // 작품 존재 및 소유자 확인
    const existingWork = await prisma.work.findFirst({
      where: {
        workId: workId,
        userId: me.userId
      }
    });

    if (!existingWork) {
      return NextResponse.json({ 
        error: "Work not found or unauthorized" 
      }, { status: 404 });
    }

    // status 필드 변환 함수
    const parseWorkStatus = (status: string): WorkStatus => {
      const normalizedStatus = status.toLowerCase();
      switch (normalizedStatus) {
        case 'completed':
          return WorkStatus.completed;
        case 'draft':
          return WorkStatus.draft;
        default:
          return existingWork.status; // 기존 상태 유지
      }
    };

    // 업데이트할 데이터 준비
    const updateData: {
      title?: string;
      coverImage?: string | null;
      status?: WorkStatus;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // 각 필드별로 업데이트 여부 확인
    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.coverImage !== undefined) {
      updateData.coverImage = body.coverImage;
    }

    if (body.status !== undefined) {
      updateData.status = parseWorkStatus(body.status);
      console.log('상태 변경:', body.status, '->', updateData.status);
    }

    // 작품 정보 업데이트
    const updatedWork = await prisma.work.update({
      where: {
        workId: workId
      },
      data: updateData,
      include: {
        pages: {
          orderBy: { orderIndex: "asc" }
        },
        printSpec: true,
        exports: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    console.log('작품 업데이트 완료:', updatedWork.workId, '상태:', updatedWork.status);

    const response = {
      id: updatedWork.workId,
      title: updatedWork.title,
      status: updatedWork.status.toLowerCase(),
      coverImage: updatedWork.coverImage,
      coverTemplateId: updatedWork.coverTemplateId || undefined,
      createdAt: updatedWork.createdAt.toISOString(),
      updatedAt: updatedWork.updatedAt.toISOString(),
      pages: updatedWork.pages.map((page) => ({
        id: page.pageId,
        type: page.contentType.toLowerCase(),
        content: page.contentJson,
        order: page.orderIndex,
      })),
      printSpec: updatedWork.printSpec ? {
        specId: updatedWork.printSpec.specId,
        paperSize: updatedWork.printSpec.paperSize.toLowerCase(),
        coverType: updatedWork.printSpec.coverType.toLowerCase(),
        innerPaper: updatedWork.printSpec.innerPaper.toLowerCase(),
        orientation: updatedWork.printSpec.orientation || "portrait",
        additionalOptions: updatedWork.printSpec.additionalOptions,
      } : null,
      exports: updatedWork.exports?.map((exp) => ({
        id: exp.exportId,
        fileType: exp.fileType,
        filePath: exp.filePath,
        createdAt: exp.createdAt.toISOString(),
      })) || [],
    };

    // work 객체로 감싸지 않고 직접 반환
    return NextResponse.json(response);

  } catch (err) {
    console.error("Update work error:", err);
    
    if (err instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to update work",
        details: err.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Unknown error occurred" 
    }, { status: 500 });
  }
}

// 작품 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getSessionUser();
    if (!me) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: workId } = await params;

    if (!workId) {
      return NextResponse.json({ error: "Work ID is required" }, { status: 400 });
    }

    // 작품 존재 및 소유자 확인
    const existingWork = await prisma.work.findFirst({
      where: {
        workId: workId,
        userId: me.userId
      }
    });

    if (!existingWork) {
      return NextResponse.json({ 
        error: "Work not found or unauthorized" 
      }, { status: 404 });
    }

    // 관련 데이터와 함께 삭제 (CASCADE로 자동 삭제됨)
    await prisma.work.delete({
      where: {
        workId: workId
      }
    });

    return NextResponse.json({ 
      message: "Work deleted successfully" 
    });

  } catch (err) {
    console.error("Delete work error:", err);
    return NextResponse.json({ 
      error: "Failed to delete work" 
    }, { status: 500 });
  }
}