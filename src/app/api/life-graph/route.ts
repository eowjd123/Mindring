// app/api/life-graph/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { prisma } from '@/lib/prisma'; // 🔹 권장: 싱글톤 Prisma Client
import { getSessionUser } from '@/lib/session';

// -------------------- Types & Mappings --------------------

/** 프론트 감정 유니온 */
type EmotionType = 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'VERY_SAD';

interface UserInfo {
  name: string;
  birthYear: number;
  location: string;
}

interface LifeEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  emotion: EmotionType;
}

// 점수/감정 매핑 (양방향)
const emotionToScore: Record<EmotionType, 1 | 2 | 3 | 4 | 5> = {
  VERY_HAPPY: 5,
  HAPPY: 4,
  NEUTRAL: 3,
  SAD: 2,
  VERY_SAD: 1,
};

const scoreToEmotion: Record<1 | 2 | 3 | 4 | 5, EmotionType> = {
  5: 'VERY_HAPPY',
  4: 'HAPPY',
  3: 'NEUTRAL',
  2: 'SAD',
  1: 'VERY_SAD',
};

/** 프론트 감정 → Prisma 스키마 enum($Enums.Emotion) */
const emotionToPrisma: Record<EmotionType, $Enums.Emotion> = {
  VERY_HAPPY: 'joy',     // 필요에 따라 'surprise' 등으로 조정 가능
  HAPPY: 'joy',          // 예: HAPPY를 'surprise'로 매핑하려면 'surprise'로 변경
  NEUTRAL: 'neutral',
  SAD: 'sadness',
  VERY_SAD: 'sadness',
};

// 안전한 점수 키(1~5)로 클램프
const toScoreKey = (n: number): 1 | 2 | 3 | 4 | 5 => {
  const r = Math.round(n);
  if (r <= 1) return 1;
  if (r >= 5) return 5;
  return r as 2 | 3 | 4; // r이 2~4 범위
};

// -------------------- GET: 조회 --------------------

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 사용자 인생그래프 + 포인트
    const lifeGraph = await prisma.lifeGraph.findFirst({
      where: { userId: user.userId },
      include: {
        points: { orderBy: { date: 'asc' } },
      },
    });

    const userInfo: UserInfo = {
      name: user.name || '사용자',
      birthYear: lifeGraph?.startDate
        ? new Date(lifeGraph.startDate).getFullYear()
        : new Date().getFullYear() - 30,
      location: '서울', // TODO: User 모델에 location 추가 시 교체
    };

    const events: LifeEvent[] =
      lifeGraph?.points.map((point) => {
        const key = toScoreKey(Number(point.score));
        return {
          id: point.pointId,
          year: new Date(point.date).getFullYear(),
          title:
            point.title || `${new Date(point.date).getFullYear()}년의 기억`,
          description: point.description || '소중한 추억',
          emotion: scoreToEmotion[key],
        };
      }) ?? [];

    return NextResponse.json({
      success: true,
      userInfo,
      events,
    });
  } catch (error) {
    console.error('Failed to fetch life graph:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch life graph' },
      { status: 500 }
    );
  }
}

// -------------------- POST: 저장 --------------------

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userInfo,
      events,
    }: {
      userInfo: UserInfo;
      events: LifeEvent[];
    } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1) 사용자 이름 업데이트 (필요 시 location 등 추가)
      await tx.user.update({
        where: { userId: user.userId },
        data: { name: userInfo.name },
      });

      // 2) 그래프 upsert 유사 로직
      const startDate = new Date(userInfo.birthYear, 0, 1);
      const title = `${userInfo.name || '사용자'}의 인생그래프`;

      let lifeGraph = await tx.lifeGraph.findFirst({
        where: { userId: user.userId },
      });

      if (!lifeGraph) {
        lifeGraph = await tx.lifeGraph.create({
          data: {
            userId: user.userId,
            title,
            description: '나의 소중한 인생 여정',
            startDate,
            minScore: 1,
            maxScore: 5,
          },
        });
      } else {
        lifeGraph = await tx.lifeGraph.update({
          where: { graphId: lifeGraph.graphId },
          data: {
            title,
            startDate,
            updatedAt: new Date(),
          },
        });
      }

      // 3) 기존 포인트 제거
      await tx.lifeGraphPoint.deleteMany({
        where: { graphId: lifeGraph.graphId },
      });

      // 4) 새 포인트 생성
      const count =
        events && events.length > 0
          ? await tx.lifeGraphPoint.createMany({
              data: events.map((event) => ({
                graphId: lifeGraph!.graphId,
                date: new Date(event.year, 0, 1),
                score: emotionToScore[event.emotion], // 1~5
                title: event.title,
                description: event.description,
                emotion: emotionToPrisma[event.emotion], // ✅ $Enums.Emotion, any 제거
              })),
            })
          : { count: 0 };

      return { lifeGraph, pointsCount: count.count };
    });

    return NextResponse.json({
      success: true,
      message: 'Life graph saved successfully',
      graphId: result.lifeGraph.graphId,
      pointsCount: result.pointsCount,
    });
  } catch (error) {
    console.error('Failed to save life graph:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save life graph',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
