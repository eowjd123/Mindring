import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { orderIndex, contentType, contentJson } = await req.json();
  // 권한 체크
  const w = await prisma.work.findFirst({ where: { workId: params.id, userId: me.userId } });
  if (!w) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const page = await prisma.page.create({
    data: { workId: w.workId, orderIndex, contentType, contentJson },
  });
  return NextResponse.json(page, { status: 201 });
}
