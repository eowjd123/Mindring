import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";

export async function GET() {
  try {
    // 인증 체크
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 체크
    const isAdmin = await checkAdminPermission(user.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 기본 통계
    const [totalUsers, totalAssessments] = await Promise.all([
      prisma.user.count(),
      prisma.cognitiveAssessment.count(),
    ]);

    // 검사 유형별 통계
    const assessmentsByType = await prisma.cognitiveAssessment.groupBy({
      by: ["assessmentType"],
      _count: true,
    });

    const assessmentsByTypeMap: Record<string, number> = {};
    assessmentsByType.forEach((item) => {
      assessmentsByTypeMap[item.assessmentType] = item._count;
    });

    // 최근 7일 검사 추이
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAssessments = await prisma.cognitiveAssessment.findMany({
      where: {
        testDate: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        testDate: true,
      },
    });

    // 날짜별 그룹화
    const assessmentsByDateMap: Record<string, number> = {};
    recentAssessments.forEach((assessment) => {
      const date = assessment.testDate.toISOString().split("T")[0];
      assessmentsByDateMap[date] = (assessmentsByDateMap[date] || 0) + 1;
    });

    const assessmentsByDate = Object.entries(assessmentsByDateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 위험도 분포
    const riskLevelDistribution = await prisma.cognitiveAssessment.groupBy({
      by: ["riskLevel"],
      _count: true,
      where: {
        riskLevel: {
          not: null,
        },
      },
    });

    const riskLevelMap: Record<string, number> = {};
    riskLevelDistribution.forEach((item) => {
      if (item.riskLevel) {
        riskLevelMap[item.riskLevel] = item._count;
      }
    });

    return NextResponse.json({
      totalUsers,
      totalAssessments,
      assessmentsByType: assessmentsByTypeMap,
      assessmentsByDate,
      riskLevelDistribution: riskLevelMap,
    });
  } catch (error) {
    console.error("Admin statistics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

