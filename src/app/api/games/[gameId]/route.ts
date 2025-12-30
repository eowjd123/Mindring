import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type MemoryAsset = {
  id: string | number;
  label?: string;
  imageUrl?: string;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  // For development/demo return a small set of emoji assets.
  const assets: MemoryAsset[] = [
    { id: "1", label: "🍎" },
    { id: "2", label: "🐶" },
    { id: "3", label: "🚗" },
    { id: "4", label: "🌟" },
    { id: "5", label: "🎵" },
    { id: "6", label: "⚽️" },
    { id: "7", label: "🍰" },
    { id: "8", label: "🧩" },
    { id: "9", label: "🌈" },
    { id: "10", label: "🦋" },
  ];

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  try {
    const body = await req.json();
    // body should contain { time, level, moves, success, round }
    console.log(`[games/${gameId}/score]`, body);
    
    // 사용자 인증 확인
    const session = await getSession();
    if (!session?.userId) {
      console.log("No authenticated user, saving score without user association");
      return NextResponse.json({ ok: true, saved: false }, { status: 201 });
    }

    // 게임 타입 결정 (gameId에서 추론)
    let gameType = "unknown";
    if (gameId.includes("memory")) {
      gameType = "memory-match";
    } else if (gameId.includes("color")) {
      gameType = "color-sequence";
    }

    // 점수 계산 (게임 타입별로 다르게)
    let score = 0;
    if (gameType === "memory-match") {
      // 메모리 게임: 시간이 짧을수록, 이동이 적을수록 높은 점수
      const timeScore = Math.max(0, 300 - body.time);
      const movesScore = Math.max(0, 100 - body.moves * 5);
      score = Math.round((timeScore + movesScore) / 4);
    } else if (gameType === "color-sequence") {
      // 색상 순서 게임: 라운드에 따라 점수 계산
      score = body.success ? body.round * 10 : Math.max(0, (body.round - 1) * 10);
    }

    // DB에 저장
    const gameScore = await prisma.gameScore.create({
      data: {
        userId: session.userId,
        gameId,
        gameType,
        level: body.level || 1,
        round: body.round || 1,
        moves: body.moves || 0,
        time: body.time || 0,
        score,
        success: body.success !== false,
      },
    });

    return NextResponse.json({ ok: true, saved: true, scoreId: gameScore.scoreId }, { status: 201 });
  } catch (err) {
    console.error("Error saving game score:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
