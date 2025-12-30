import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  try {
    const body = await req.json();
    // body should contain { time, level, moves, success, round }
    console.log(`[games/${gameId}/score]`, body);
    
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

    // TODO: 사용자 인증 구현 후 userId와 함께 저장
    // 현재는 userId 없이 저장 (나중에 미들웨어에서 인증 추가)
    console.log("Game score calculated:", { gameId, gameType, score, level: body.level });

    return NextResponse.json({ ok: true, saved: true, score }, { status: 201 });
  } catch (err) {
    console.error("Error saving game score:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
