import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId } = await params;

    // 사용자 정보 조회
    const userDetail = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!userDetail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 검사 결과 조회
    const assessments = await prisma.cognitiveAssessment.findMany({
      where: { userId },
      select: {
        assessmentId: true,
        assessmentType: true,
        testDate: true,
        totalScore: true,
        riskLevel: true,
        interpretation: true,
      },
      orderBy: { testDate: "desc" },
      take: 50, // 최근 50개만
    });

    // 작품 수 조회
    const workCount = await prisma.work.count({
      where: { userId },
    });

    // 검사 횟수
    const assessmentCount = await prisma.cognitiveAssessment.count({
      where: { userId },
    });

    return NextResponse.json({
      user: {
        ...userDetail,
        createdAt: userDetail.createdAt.toISOString(),
        assessmentCount,
        workCount,
      },
      assessments: assessments.map((a) => ({
        ...a,
        testDate: a.testDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

