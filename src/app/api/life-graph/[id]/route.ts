// app/api/life-graph/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/* ======================
   Types & Mappings
   ====================== */
type EmotionKey = "VERY_HAPPY" | "HAPPY" | "NEUTRAL" | "SAD" | "VERY_SAD";
type PrismaEmotion = "joy" | "neutral" | "sadness";

const emotionToScore: Record<EmotionKey, 1 | 2 | 3 | 4 | 5> = {
  VERY_HAPPY: 5,
  HAPPY: 4,
  NEUTRAL: 3,
  SAD: 2,
  VERY_SAD: 1,
} as const;

const scoreToEmotion: Record<1 | 2 | 3 | 4 | 5, EmotionKey> = {
  5: "VERY_HAPPY",
  4: "HAPPY",
  3: "NEUTRAL",
  2: "SAD",
  1: "VERY_SAD",
} as const;

const emotionToPrisma: Record<EmotionKey, PrismaEmotion> = {
  VERY_HAPPY: "joy",
  HAPPY: "joy",
  NEUTRAL: "neutral",
  SAD: "sadness",
  VERY_SAD: "sadness",
} as const;

/* ======================
   Helpers
   ====================== */
function clampScore(n: number): 1 | 2 | 3 | 4 | 5 {
  const r = Math.round(n);
  if (r <= 1) return 1;
  if (r >= 5) return 5;
  return r as 2 | 3 | 4;
}

function isValidYear(y: unknown): y is number {
  return typeof y === "number" && Number.isFinite(y) && y >= 1900 && y <= 2100;
}

function sanitizeEvents(
  input: Array<{
    id: string;
    year: number;
    title: string;
    description: string;
    emotion: EmotionKey;
  }> = []
) {
  return input
    .filter(
      (e) =>
        isValidYear(e.year) &&
        typeof e.title === "string" &&
        e.title.trim().length > 0 &&
        (e.emotion as EmotionKey) in emotionToScore
    )
    .sort((a, b) => a.year - b.year);
}

/* ======================
   Route handlers
   ====================== */
type Params = { id: string };
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> } // ✅ params를 Promise로
) {
  try {
    const { id: graphId } = await context.params;       // ✅ await
    const userId = request.headers.get("x-user-id") || "test-user-id";

    const lifeGraph = await prisma.lifeGraph.findFirst({
      where: { graphId, userId },
      include: {
        points: { orderBy: { date: "asc" } },
        user: { select: { name: true, userId: true } },
      },
    });

    if (!lifeGraph) {
      return NextResponse.json(
        { error: "Life graph not found or access denied" },
        { status: 404 }
      );
    }

    const userInfo = {
      name: lifeGraph.user?.name ?? "",
      birthYear: new Date(lifeGraph.startDate).getFullYear(),
      location: "",
    };

    const events = lifeGraph.points.map((p) => {
      const sc = clampScore(Number(p.score));
      return {
        id: p.pointId,
        year: new Date(p.date).getFullYear(),
        title: p.title ?? "",
        description: p.description ?? "",
        emotion: scoreToEmotion[sc],
      };
    });

    return NextResponse.json({
      graphId: lifeGraph.graphId,
      title: lifeGraph.title,
      description: lifeGraph.description,
      userInfo,
      events,
      isPublic: lifeGraph.isPublic,
      shareToken: lifeGraph.shareToken,
      createdAt: lifeGraph.createdAt.toISOString(),
      updatedAt: lifeGraph.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch life graph:", error);
    return NextResponse.json(
      { error: "Failed to fetch life graph" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> } // ✅
) {
  try {
    const { id: graphId } = await context.params;        // ✅
    const userId = request.headers.get("x-user-id") || "test-user-id";

    const body = (await request.json()) as {
      userInfo?: { name: string; birthYear: number; location: string };
      events?: Array<{
        id: string;
        year: number;
        title: string;
        description: string;
        emotion: EmotionKey;
      }>;
      title?: string;
      description?: string;
      isPublic?: boolean;
    };

    const existing = await prisma.lifeGraph.findFirst({
      where: { graphId, userId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Life graph not found or access denied" },
        { status: 404 }
      );
    }

    const cleanedEvents = sanitizeEvents(body.events ?? []);

    const result = await prisma.$transaction(async (tx) => {
      if (body.userInfo?.name) {
        await tx.user.update({
          where: { userId },
          data: { name: body.userInfo.name },
        });
      }

      const newStartDate =
        body.userInfo?.birthYear && isValidYear(body.userInfo.birthYear)
          ? new Date(body.userInfo.birthYear, 0, 1)
          : existing.startDate;

      const newTitle =
        body.title ??
        (body.userInfo?.name
          ? `${body.userInfo.name}의 인생그래프`
          : existing.title);

      const updatedGraph = await tx.lifeGraph.update({
        where: { graphId },
        data: {
          title: newTitle,
          description: body.description ?? existing.description,
          isPublic:
            typeof body.isPublic === "boolean" ? body.isPublic : existing.isPublic,
          startDate: newStartDate,
          updatedAt: new Date(),
        },
      });

      if (body.events) {
        await tx.lifeGraphPoint.deleteMany({ where: { graphId } });

        if (cleanedEvents.length > 0) {
          await tx.lifeGraphPoint.createMany({
            data: cleanedEvents.map((e) => ({
              graphId,
              date: new Date(e.year, 0, 1),
              score: emotionToScore[e.emotion],
              title: e.title,
              description: e.description,
              emotion: emotionToPrisma[e.emotion],
            })),
          });
        }
      }

      return updatedGraph;
    });

    return NextResponse.json({
      message: "Life graph updated successfully",
      graphId: result.graphId,
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to update life graph:", error);
    return NextResponse.json(
      { error: "Failed to update life graph" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> } // ✅
) {
  try {
    const { id: graphId } = await context.params;        // ✅
    const userId = "test-user-id"; // TODO: 세션/JWT에서 추출

    const existing = await prisma.lifeGraph.findFirst({
      where: { graphId, userId },
      select: { graphId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Life graph not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.lifeGraph.delete({ where: { graphId } });

    return NextResponse.json({
      message: "Life graph deleted successfully",
      graphId,
    });
  } catch (error) {
    console.error("Failed to delete life graph:", error);
    return NextResponse.json(
      { error: "Failed to delete life graph" },
      { status: 500 }
    );
  }
}
