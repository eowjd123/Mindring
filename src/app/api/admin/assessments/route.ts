import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  try {
    // 인증 체크
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: 관리자 권한 체크 추가

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // 검색 조건
    const where: any = {};
    if (type && type !== "all") {
      where.assessmentType = type;
    }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { userId: { contains: search } },
        ],
      };
    }

    // 검사 결과 목록 조회
    const [assessments, total] = await Promise.all([
      prisma.cognitiveAssessment.findMany({
        where,
        include: {
          user: {
            select: {
              userId: true,
              name: true,
            },
          },
        },
        orderBy: { testDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.cognitiveAssessment.count({ where }),
    ]);

    const formattedAssessments = assessments.map((assessment) => ({
      assessmentId: assessment.assessmentId,
      userId: assessment.userId,
      userName: assessment.user.name,
      assessmentType: assessment.assessmentType,
      testDate: assessment.testDate.toISOString(),
      totalScore: assessment.totalScore,
      riskLevel: assessment.riskLevel,
      interpretation: assessment.interpretation,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      assessments: formattedAssessments,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Admin assessments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

