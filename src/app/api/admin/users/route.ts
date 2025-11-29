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
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // 검색 조건
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    // 사용자 목록 조회
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          userId: true,
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // 각 사용자의 검사 횟수 조회
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const assessmentCount = await prisma.cognitiveAssessment.count({
          where: { userId: user.userId },
        });
        return {
          ...user,
          assessmentCount,
          createdAt: user.createdAt.toISOString(),
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: usersWithCounts,
      total,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

