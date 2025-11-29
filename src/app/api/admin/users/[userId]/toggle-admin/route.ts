import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
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

    const { userId } = params;
    const { isAdmin: newIsAdmin } = await req.json();

    // 자기 자신의 권한을 해제하는 것은 방지
    if (userId === user.userId && !newIsAdmin) {
      return NextResponse.json(
        { error: "Cannot revoke your own admin privileges" },
        { status: 400 }
      );
    }

    // 사용자 권한 업데이트
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { isAdmin: newIsAdmin },
      select: {
        userId: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      message: "Admin status updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

