import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";

export async function GET(
  req: Request,
  { params }: { params: { assessmentId: string } }
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

    const { assessmentId } = params;

    // 검사 결과 상세 조회
    const assessment = await prisma.cognitiveAssessment.findUnique({
      where: { assessmentId },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // JSON 필드 파싱
    const recommendations =
      assessment.recommendations && typeof assessment.recommendations === "object"
        ? (assessment.recommendations as any)
        : null;

    const recommendationsArray = Array.isArray(recommendations)
      ? recommendations
      : recommendations
      ? [recommendations]
      : null;

    // metadata에서 education과 relationship 추출
    const metadata = assessment.metadata && typeof assessment.metadata === "object"
      ? (assessment.metadata as any)
      : null;

    const education = metadata?.education || null;
    const relationship = metadata?.relationship || null;

    return NextResponse.json({
      assessmentId: assessment.assessmentId,
      userId: assessment.userId,
      userName: assessment.user.name,
      userEmail: assessment.user.email,
      assessmentType: assessment.assessmentType,
      testDate: assessment.testDate.toISOString(),
      age: assessment.age,
      gender: assessment.gender,
      education: education,
      relationship: relationship,
      answers: assessment.answers,
      totalScore: assessment.totalScore,
      averageScore: assessment.averageScore,
      percentage: assessment.percentage,
      riskLevel: assessment.riskLevel,
      interpretation: assessment.interpretation,
      message: assessment.message || assessment.interpretation,
      description: assessment.description || assessment.interpretation,
      recommendations: recommendationsArray,
      categoryScores: assessment.categoryScores,
      metadata: assessment.metadata,
    });
  } catch (error) {
    console.error("Admin assessment detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

