import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculatePuzzleScore } from "@/lib/puzzle-score";

/**
 * POST: 퍼즐 기록 저장
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { puzzleId, difficulty, completionTime, moves } = body;

    // 유효성 검사
    if (!puzzleId || !difficulty || completionTime === undefined || moves === undefined) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 점수 계산
    const score = calculatePuzzleScore({
      difficulty,
      completionTime,
      moves,
    });

    // Prisma 클라이언트 확인
    if (!prisma.puzzleRecord) {
      console.error('PuzzleRecord model not found in Prisma client. Please run: npx prisma generate');
      return NextResponse.json(
        { error: "데이터베이스 모델을 찾을 수 없습니다. Prisma 클라이언트를 재생성해주세요." },
        { status: 500 }
      );
    }

    // 기록 저장
    const record = await prisma.puzzleRecord.create({
      data: {
        userId: user.userId,
        puzzleId: String(puzzleId),
        difficulty: Number(difficulty),
        completionTime: Number(completionTime),
        moves: Number(moves),
        score,
        completed: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      record: {
        recordId: record.recordId,
        score: record.score,
        rank: null, // 랭킹은 별도 조회
      },
    });
  } catch (error) {
    console.error("Failed to save puzzle record:", error);
    return NextResponse.json(
      { error: "기록 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET: 개인 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const puzzleId = searchParams.get("puzzleId");
    const difficulty = searchParams.get("difficulty");

    const where: any = {
      userId: user.userId,
      completed: true,
    };

    if (puzzleId) {
      where.puzzleId = puzzleId;
    }
    if (difficulty) {
      where.difficulty = parseInt(difficulty);
    }

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
        { completedAt: "desc" },
      ],
      take: 10, // 최대 10개
    });

    return NextResponse.json({
      success: true,
      records: records.map((r) => ({
        recordId: r.recordId,
        puzzleId: r.puzzleId,
        difficulty: r.difficulty,
        completionTime: r.completionTime,
        moves: r.moves,
        score: r.score,
        completedAt: r.completedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch puzzle records:", error);
    return NextResponse.json(
      { error: "기록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}

