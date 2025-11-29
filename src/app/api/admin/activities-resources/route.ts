import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// GET: 활동자료 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get("visible") === "true";
    
    const where = visibleOnly ? { visible: true } : {};
    
    const resources = await prisma.activityResource.findMany({
      where,
      orderBy: [
        { popularScore: "desc" },
        { createdAt: "desc" },
      ],
    });
    
    // Prisma 모델을 API 응답 형식으로 변환
    const formattedResources = resources.map((r) => ({
      id: r.resourceId,
      title: r.title,
      subtitle: r.subtitle || undefined,
      thumbnail: r.thumbnail || undefined,
      fileUrl: r.fileUrl || undefined,
      tags: Array.isArray(r.tags) ? r.tags : [],
      category: r.category,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      popularScore: r.popularScore,
      visible: r.visible,
    }));
    
    return NextResponse.json({ resources: formattedResources });
  } catch (error) {
    console.error("Failed to read resources:", error);
    return NextResponse.json({ resources: [] });
  }
}

// POST: 새 활동자료 추가
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const {
      title,
      subtitle,
      thumbnail,
      fileUrl,
      tags,
      category,
      popularScore = 0,
      visible = true,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "제목과 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    const newResource = await prisma.activityResource.create({
      data: {
        title,
        subtitle: subtitle || null,
        thumbnail: thumbnail || null,
        fileUrl: fileUrl || null,
        tags: Array.isArray(tags) ? tags : [],
        category,
        popularScore: Number(popularScore) || 0,
        visible: Boolean(visible),
      },
    });

    return NextResponse.json({
      resource: {
        id: newResource.resourceId,
        title: newResource.title,
        subtitle: newResource.subtitle || undefined,
        thumbnail: newResource.thumbnail || undefined,
        fileUrl: newResource.fileUrl || undefined,
        tags: Array.isArray(newResource.tags) ? newResource.tags : [],
        category: newResource.category,
        createdAt: newResource.createdAt.toISOString(),
        updatedAt: newResource.updatedAt.toISOString(),
        popularScore: newResource.popularScore,
        visible: newResource.visible,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    console.error("Failed to create resource:", error);
    return NextResponse.json(
      { error: "활동자료 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 활동자료 수정
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID는 필수입니다." },
        { status: 400 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle || null;
    if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail || null;
    if (updates.fileUrl !== undefined) updateData.fileUrl = updates.fileUrl || null;
    if (updates.tags !== undefined) updateData.tags = Array.isArray(updates.tags) ? updates.tags : [];
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.popularScore !== undefined) updateData.popularScore = Number(updates.popularScore) || 0;
    if (updates.visible !== undefined) updateData.visible = Boolean(updates.visible);

    const updatedResource = await prisma.activityResource.update({
      where: { resourceId: id },
      data: updateData,
    });

    return NextResponse.json({
      resource: {
        id: updatedResource.resourceId,
        title: updatedResource.title,
        subtitle: updatedResource.subtitle || undefined,
        thumbnail: updatedResource.thumbnail || undefined,
        fileUrl: updatedResource.fileUrl || undefined,
        tags: Array.isArray(updatedResource.tags) ? updatedResource.tags : [],
        category: updatedResource.category,
        createdAt: updatedResource.createdAt.toISOString(),
        updatedAt: updatedResource.updatedAt.toISOString(),
        popularScore: updatedResource.popularScore,
        visible: updatedResource.visible,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "활동자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    console.error("Failed to update resource:", error);
    return NextResponse.json(
      { error: "활동자료 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 활동자료 삭제
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID는 필수입니다." },
        { status: 400 }
      );
    }

    await prisma.activityResource.delete({
      where: { resourceId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "활동자료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    console.error("Failed to delete resource:", error);
    return NextResponse.json(
      { error: "활동자료 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

