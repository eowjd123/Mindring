// app/api/life-graph/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 감정 매핑
const emotionToScore = {
  'VERY_HAPPY': 5,
  'HAPPY': 4,
  'NEUTRAL': 3,
  'SAD': 2,
  'VERY_SAD': 1
} as const;

const scoreToEmotion = {
  5: 'VERY_HAPPY',
  4: 'HAPPY',
  3: 'NEUTRAL',
  2: 'SAD',
  1: 'VERY_SAD'
} as const;

const emotionToPrisma = {
  'VERY_HAPPY': 'joy',
  'HAPPY': 'joy',
  'NEUTRAL': 'neutral',
  'SAD': 'sadness',
  'VERY_SAD': 'sadness'
} as const;

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: 특정 인생그래프 조회
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: 실제로는 JWT 토큰이나 세션에서 userId 추출
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const graphId = params.id;

    // 인생그래프 조회 (권한 확인 포함)
    const lifeGraph = await prisma.lifeGraph.findFirst({
      where: {
        graphId,
        userId // 소유자만 조회 가능
      },
      include: {
        points: {
          orderBy: { date: 'asc' }
        },
        user: {
          select: {
            name: true,
            userId: true
          }
        }
      }
    });

    if (!lifeGraph) {
      return NextResponse.json(
        { error: 'Life graph not found or access denied' },
        { status: 404 }
      );
    }

    // 응답 데이터 구성
    const userInfo = {
      name: lifeGraph.user.name || '',
      birthYear: new Date(lifeGraph.startDate).getFullYear(),
      location: '' // 추후 User 모델에 location 필드 추가 필요
    };

    const events = lifeGraph.points.map(point => ({
      id: point.pointId,
      year: new Date(point.date).getFullYear(),
      title: point.title || '',
      description: point.description || '',
      emotion: scoreToEmotion[Math.round(point.score) as keyof typeof scoreToEmotion] || 'NEUTRAL'
    }));

    return NextResponse.json({
      graphId: lifeGraph.graphId,
      title: lifeGraph.title,
      description: lifeGraph.description,
      userInfo,
      events,
      isPublic: lifeGraph.isPublic,
      shareToken: lifeGraph.shareToken,
      createdAt: lifeGraph.createdAt,
      updatedAt: lifeGraph.updatedAt
    });

  } catch (error) {
    console.error('Failed to fetch life graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch life graph' },
      { status: 500 }
    );
  }
}

// PUT: 특정 인생그래프 수정
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: 실제로는 JWT 토큰이나 세션에서 userId 추출
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const graphId = params.id;

    const body = await request.json() as {
      userInfo?: {
        name: string;
        birthYear: number;
        location: string;
      };
      events?: Array<{
        id: string;
        year: number;
        title: string;
        description: string;
        emotion: keyof typeof emotionToScore;
      }>;
      title?: string;
      description?: string;
      isPublic?: boolean;
    };
    const { userInfo, events, title, description, isPublic } = body;

    // 권한 확인
    const existingGraph = await prisma.lifeGraph.findFirst({
      where: {
        graphId,
        userId
      }
    });

    if (!existingGraph) {
      return NextResponse.json(
        { error: 'Life graph not found or access denied' },
        { status: 404 }
      );
    }

    // 사용자 정보 업데이트
    if (userInfo) {
      await prisma.user.update({
        where: { userId },
        data: {
          name: userInfo.name
        }
      });
    }

    // 인생그래프 메타데이터 업데이트
    const updatedGraph = await prisma.lifeGraph.update({
      where: { graphId },
      data: {
        title: title || `${userInfo?.name || '사용자'}의 인생그래프`,
        description: description || existingGraph.description,
        isPublic: isPublic !== undefined ? isPublic : existingGraph.isPublic,
        startDate: userInfo?.birthYear ? new Date(userInfo.birthYear, 0, 1) : existingGraph.startDate,
        updatedAt: new Date()
      }
    });

    // 이벤트 데이터가 있으면 포인트 업데이트
    if (events !== undefined) {
      // 기존 포인트들 삭제
      await prisma.lifeGraphPoint.deleteMany({
        where: { graphId }
      });

      // 새로운 포인트들 생성
      if (events.length > 0) {
        const pointsData = events.map((event) => ({
          graphId,
          date: new Date(event.year, 0, 1),
          score: emotionToScore[event.emotion],
          title: event.title,
          description: event.description,
          emotion: emotionToPrisma[event.emotion]
        }));

        await prisma.lifeGraphPoint.createMany({
          data: pointsData
        });
      }
    }

    return NextResponse.json({
      message: 'Life graph updated successfully',
      graphId: updatedGraph.graphId,
      updatedAt: updatedGraph.updatedAt
    });

  } catch (error) {
    console.error('Failed to update life graph:', error);
    return NextResponse.json(
      { error: 'Failed to update life graph' },
      { status: 500 }
    );
  }
}

// DELETE: 특정 인생그래프 삭제
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: 실제로는 JWT 토큰이나 세션에서 userId 추출
    const userId = request.headers.get('x-user-id') || 'test-user-id';
    const graphId = params.id;

    // 권한 확인
    const existingGraph = await prisma.lifeGraph.findFirst({
      where: {
        graphId,
        userId
      }
    });

    if (!existingGraph) {
      return NextResponse.json(
        { error: 'Life graph not found or access denied' },
        { status: 404 }
      );
    }

    // 인생그래프 삭제 (Cascade로 관련 데이터도 함께 삭제됨)
    await prisma.lifeGraph.delete({
      where: { graphId }
    });

    return NextResponse.json({
      message: 'Life graph deleted successfully',
      graphId
    });

  } catch (error) {
    console.error('Failed to delete life graph:', error);
    return NextResponse.json(
      { error: 'Failed to delete life graph' },
      { status: 500 }
    );
  }
}