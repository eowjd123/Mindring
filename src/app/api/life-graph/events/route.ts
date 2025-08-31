// app/api/life-graph/events/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Emotion 타입 정의
type EmotionType = "joy" | "surprise" | "neutral" | "sadness" | "anger";

// 감정을 점수로 매핑 (-5 ~ 5)
function mapEmotionToScore(emotion: string): number {
  switch (emotion) {
    case "VERY_HAPPY":
      return 5;
    case "HAPPY":
      return 3;
    case "NEUTRAL":
      return 0;
    case "SAD":
      return -3;
    case "VERY_SAD":
      return -5;
    default:
      return 0;
  }
}

// 프론트엔드 감정을 스키마 Emotion으로 매핑
function mapEmotionToSchema(emotion: string): EmotionType {
  switch (emotion) {
    case "VERY_HAPPY":
      return "joy";
    case "HAPPY":
      return "surprise";
    case "NEUTRAL":
      return "neutral";
    case "SAD":
      return "sadness";
    case "VERY_SAD":
      return "anger";
    default:
      return "neutral";
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const { year, title, description, emotion } = await request.json();

    // 입력 유효성 검사
    if (!year || !title || !emotion) {
      return NextResponse.json(
        { error: "Year, title, and emotion are required" },
        { status: 400 }
      );
    }

    // 기본 인생그래프가 있는지 확인, 없으면 생성
    let lifeGraph = await prisma.lifeGraph.findFirst({
      where: { userId }
    });

    if (!lifeGraph) {
      // 기본 인생그래프 생성
      lifeGraph = await prisma.lifeGraph.create({
        data: {
          userId,
          title: `${user.name || "나"}의 인생그래프`,
          description: "나의 소중한 인생 여정",
          startDate: new Date(year, 0, 1), // 해당 연도 1월 1일
          minScore: -5,
          maxScore: 5
        }
      });
    }

    // 감정을 점수로 매핑
    const emotionScore = mapEmotionToScore(emotion);
    const schemaEmotion = mapEmotionToSchema(emotion);

    // 포인트 생성
    const point = await prisma.lifeGraphPoint.create({
      data: {
        graphId: lifeGraph.graphId,
        date: new Date(year, 5, 15), // 해당 연도 6월 15일 (중간 지점)
        score: emotionScore,
        title,
        description: description || "",
        emotion: schemaEmotion
      }
    });

    return NextResponse.json({
      id: point.pointId,
      year: parseInt(year),
      title,
      description: description || "",
      emotion
    });
  } catch (error) {
    console.error("Create Life Graph Event Error:", error);
    return NextResponse.json(
      { error: "Failed to create life graph event" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.userId;
    const { id, year, title, description, emotion } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const emotionScore = mapEmotionToScore(emotion);
    const schemaEmotion = mapEmotionToSchema(emotion);

    // 포인트 업데이트 (본인 소유만 가능)
    const updatedPoint = await prisma.lifeGraphPoint.updateMany({
      where: {
        pointId: id,
        graph: {
          userId
        }
      },
      data: {
        date: new Date(year, 5, 15),
        score: emotionScore,
        title,
        description: description || "",
        emotion: schemaEmotion
      }
    });

    if (updatedPoint.count === 0) {
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      year: parseInt(year),
      title,
      description: description || "",
      emotion
    });
  } catch (error) {
    console.error("Update Life Graph Event Error:", error);
    return NextResponse.json(
      { error: "Failed to update life graph event" },
      { status: 500 }
    );
  }
}
