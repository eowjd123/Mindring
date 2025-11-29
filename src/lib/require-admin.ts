import { getSessionUser } from "./session";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

/**
 * 관리자 권한이 있는 사용자만 접근 가능
 */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?returnUrl=" + encodeURIComponent("/admin"));
  }

  // 관리자 권한 체크
  const adminUser = await prisma.user.findUnique({
    where: { userId: user.userId },
    select: { isAdmin: true },
  });

  if (!adminUser?.isAdmin) {
    redirect("/dashboard");
  }

  return user;
}

/**
 * API 라우트에서 사용하는 관리자 권한 체크
 */
export async function checkAdminPermission(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { isAdmin: true },
    });
    return user?.isAdmin === true;
  } catch (error) {
    console.error("Admin permission check error:", error);
    return false;
  }
}

