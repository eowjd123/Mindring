import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GET: 퍼즐 랭킹 조회
 * 
 * Query Parameters:
 * - puzzleId: 특정 퍼즐 ID (선택)
 * - difficulty: 난이도 (선택)
 * - limit: 조회 개수 (기본 100)
 * - type: 'global' | 'personal' (기본 'global')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puzzleId = searchParams.get("puzzleId");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "100");
    const type = searchParams.get("type") || "global";

    const where: any = {
      completed: true,
    };

    if (puzzleId) {
      where.puzzleId = puzzleId;
    }
    if (difficulty) {
      where.difficulty = parseInt(difficulty);
    }

    // 개인 랭킹인 경우
    if (type === "personal") {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json(
          { error: "로그인이 필요합니다." },
          { status: 401 }
        );
      }
      where.userId = user.userId;
    }

    // 랭킹 조회 (점수 높은 순, 동점이면 완료 시간 빠른 순)
    // Prisma 클라이언트 확인
    if (!prisma.puzzleRecord) {
      console.error('PuzzleRecord model not found in Prisma client. Please run: npx prisma generate');
      return NextResponse.json(
        { error: "데이터베이스 모델을 찾을 수 없습니다. Prisma 클라이언트를 재생성해주세요." },
        { status: 500 }
      );
    }

    const records = await prisma.puzzleRecord.findMany({
      where,
      orderBy: [
        { score: "desc" },
        { completionTime: "asc" },
        { completedAt: "desc" },
      ],
      take: limit,
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 랭킹 계산 (동점 처리)
    let currentRank = 1;
    let previousScore: number | null = null;
    let previousTime: number | null = null;

    const rankings = records.map((record, index) => {
      // 동점이 아니거나, 동점이지만 시간이 다르면 순위 증가
      if (
        previousScore !== null &&
        (record.score !== previousScore || 
         (record.completionTime !== null && previousTime !== null && 
          record.completionTime !== previousTime))
      ) {
        currentRank = index + 1;
      }

      previousScore = record.score;
      previousTime = record.completionTime;

      return {
        rank: currentRank,
        recordId: record.recordId,
        userId: record.userId,
        userName: record.user.name || record.user.email || "익명",
        puzzleId: record.puzzleId,
        difficulty: record.difficulty,
        completionTime: record.completionTime,
        moves: record.moves,
        score: record.score,
        completedAt: record.completedAt?.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      rankings,
      total: rankings.length,
    });
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
    return NextResponse.json(
      { error: "랭킹 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

