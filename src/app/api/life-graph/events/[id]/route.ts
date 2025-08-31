// app/api/life-graph/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const isValidId = (id: string) => /^[a-z0-9]{25}$/i.test(id);

type Params = { id: string };

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> }   // ✅ Promise 형태로 변경
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: eventId } = await ctx.params;          // ✅ await으로 해제
    if (!eventId || !isValidId(eventId)) {
      return NextResponse.json(
        { success: false, error: "Invalid event id" },
        { status: 400 }
      );
    }

    const result = await prisma.lifeGraphPoint.deleteMany({
      where: {
        pointId: eventId,
        graph: { userId: user.userId },
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete Life Graph Event Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete life graph event" },
      { status: 500 }
    );
  }
}
