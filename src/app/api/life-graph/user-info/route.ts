// app/api/life-graph/user-info/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  birthYear?: number;
  location?: string;
};

export async function PUT(request: NextRequest) {
  try {
    // ✅ requireAuth()가 User를 직접 반환한다고 가정
    const me = await requireAuth();

    const { name, birthYear, location } = (await request.json()) as Body;

    const updates: { name?: string | null } = {};
    if (typeof name === "string") updates.name = name;

    if (Object.keys(updates).length) {
      await prisma.user.update({
        where: { userId: me.userId }, // ✅ PK는 userId
        data: updates,
      });
    }

    const safeBirthYear =
      typeof birthYear === "number" && birthYear >= 1900 && birthYear <= 2100
        ? birthYear
        : undefined;

    const safeLocation =
      typeof location === "string" && location.trim().length > 0
        ? location.trim()
        : undefined;

    return NextResponse.json({
      message: "User info updated successfully",
      userInfo: {
        name: updates.name ?? me.name ?? "",
        birthYear: safeBirthYear,
        location: safeLocation,
      },
    });
  } catch (error) {
    console.error("Update User Info Error:", error);
    // requireAuth가 미인증 시 throw 한다고 가정
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
