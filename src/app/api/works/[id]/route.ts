// app/api/works/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const workId = params.id;

    const work = await prisma.work.findFirst({
      where: {
        workId,
        userId
      },
      include: {
        pages: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!work) {
      return NextResponse.json(
        { error: 'Work not found or unauthorized' },
        { status: 404 }
      );
    }

    // 응답 변환
    const transformedWork = {
      id: work.workId,
      title: work.title,
      status: work.status.toUpperCase(),
      coverImage: work.coverImage,
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      pages: work.pages.map(page => ({
        id: page.pageId,
        type: page.contentType.toUpperCase(),
        order: page.orderIndex,
        content: page.contentJson
      }))
    };

    return NextResponse.json(transformedWork);

  } catch (error) {
    console.error('Get work error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const workId = params.id;

    // 작품 소유권 확인 및 삭제
    const deletedWork = await prisma.work.deleteMany({
      where: {
        workId,
        userId // 본인 소유 작품만 삭제 가능
      }
    });

    if (deletedWork.count === 0) {
      return NextResponse.json(
        { error: 'Work not found or unauthorized' },
        { status: 404 }
      );
    }

    // 관련 페이지들은 외래키 제약으로 자동 삭제됨 (Cascade)

    return NextResponse.json({
      message: 'Work deleted successfully'
    });

  } catch (error) {
    console.error('Delete work error:', error);
    return NextResponse.json(
      { error: 'Failed to delete work' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const workId = params.id;
    const { status } = await request.json();

    // 작품 상태 업데이트 (draft <-> completed)
    const updatedWork = await prisma.work.updateMany({
      where: {
        workId,
        userId
      },
      data: {
        status: status?.toLowerCase() === 'completed' ? 'completed' : 'draft',
        updatedAt: new Date()
      }
    });

    if (updatedWork.count === 0) {
      return NextResponse.json(
        { error: 'Work not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Work status updated successfully',
      status: status?.toLowerCase() === 'completed' ? 'completed' : 'draft'
    });

  } catch (error) {
    console.error('Update work status error:', error);
    return NextResponse.json(
      { error: 'Failed to update work status' },
      { status: 500 }
    );
  }
}