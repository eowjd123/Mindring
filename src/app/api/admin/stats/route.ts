import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    // 인증 체크
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: 관리자 권한 체크 추가

    // 통계 데이터 조회
    const [totalUsers, totalAssessments, recentAssessments] = await Promise.all([
      prisma.user.count(),
      prisma.cognitiveAssessment.count(),
      prisma.cognitiveAssessment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
          },
        },
      }),
    ]);

    // 인지 게임 수 (하드코딩, 추후 DB로 이동)
    const totalGames = 26; // 현재 정의된 게임 수

    return NextResponse.json({
      totalUsers,
      totalAssessments,
      totalGames,
      recentAssessments,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

