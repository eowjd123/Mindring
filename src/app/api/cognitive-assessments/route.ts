// app/api/cognitive-assessments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// 검사 결과 저장
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const {
      assessmentType,
      age,
      gender,
      testDate,
      answers,
      totalScore,
      averageScore,
      percentage,
      riskLevel,
      interpretation,
      message,
      description,
      recommendations,
      categoryScores,
      metadata,
    } = body;

    // 필수 필드 검증
    if (!assessmentType || !answers) {
      return NextResponse.json(
        { error: "MISSING_REQUIRED_FIELDS" },
        { status: 400 }
      );
    }

    // 검사 결과 저장
    const assessment = await prisma.cognitiveAssessment.create({
      data: {
        userId: user.userId,
        assessmentType,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        testDate: testDate ? new Date(testDate) : new Date(),
        answers: answers,
        totalScore: totalScore !== undefined ? parseFloat(totalScore) : null,
        averageScore: averageScore !== undefined ? parseFloat(averageScore) : null,
        percentage: percentage !== undefined ? parseFloat(percentage) : null,
        riskLevel: riskLevel || null,
        interpretation: interpretation || null,
        message: message || null,
        description: description || null,
        recommendations: recommendations || null,
        categoryScores: categoryScores || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment.assessmentId,
    });
  } catch (error) {
    console.error("POST /api/cognitive-assessments error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// 검사 결과 조회
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assessmentType = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { userId: user.userId };
    if (assessmentType) {
      where.assessmentType = assessmentType;
    }

    const [assessments, total] = await Promise.all([
      prisma.cognitiveAssessment.findMany({
        where,
        orderBy: { testDate: "desc" },
        take: limit,
        skip: offset,
        select: {
          assessmentId: true,
          assessmentType: true,
          age: true,
          gender: true,
          testDate: true,
          totalScore: true,
          averageScore: true,
          percentage: true,
          riskLevel: true,
          interpretation: true,
          message: true,
          createdAt: true,
        },
      }),
      prisma.cognitiveAssessment.count({ where }),
    ]);

    return NextResponse.json({
      assessments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET /api/cognitive-assessments error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

