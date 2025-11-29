import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

// GET: 강좌 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get("visible") === "true";
    
    const where = visibleOnly ? { visible: true } : {};
    
    const courses = await prisma.academyCourse.findMany({
      where,
      orderBy: [
        { popularScore: "desc" },
        { createdAt: "desc" },
      ],
    });
    
    // Prisma 모델을 API 응답 형식으로 변환
    const formattedCourses = courses.map((c) => ({
      id: c.courseId,
      title: c.title,
      description: c.description || undefined,
      subtitle: c.subtitle || undefined,
      thumbnail: c.thumbnail || undefined,
      category: c.category,
      instructor: c.instructor || undefined,
      courseUrl: c.courseUrl || undefined,
      price: c.price ? Number(c.price) : null,
      duration: c.duration || undefined,
      tags: Array.isArray(c.tags) ? c.tags : [],
      level: c.level || undefined,
      popularScore: c.popularScore,
      visible: c.visible,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error("Failed to read courses:", error);
    return NextResponse.json({ courses: [] });
  }
}

// POST: 새 강좌 추가
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const {
      title,
      description,
      subtitle,
      thumbnail,
      category,
      instructor,
      courseUrl,
      price,
      duration,
      tags,
      level,
      popularScore = 0,
      visible = true,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "제목과 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    const newCourse = await prisma.academyCourse.create({
      data: {
        title,
        description: description || null,
        subtitle: subtitle || null,
        thumbnail: thumbnail || null,
        category,
        instructor: instructor || null,
        courseUrl: courseUrl || null,
        price: price ? price : null,
        duration: duration || null,
        tags: Array.isArray(tags) ? tags : [],
        level: level || null,
        popularScore: Number(popularScore) || 0,
        visible: Boolean(visible),
      },
    });

    return NextResponse.json({
      course: {
        id: newCourse.courseId,
        title: newCourse.title,
        description: newCourse.description || undefined,
        subtitle: newCourse.subtitle || undefined,
        thumbnail: newCourse.thumbnail || undefined,
        category: newCourse.category,
        instructor: newCourse.instructor || undefined,
        courseUrl: newCourse.courseUrl || undefined,
        price: newCourse.price ? Number(newCourse.price) : null,
        duration: newCourse.duration || undefined,
        tags: Array.isArray(newCourse.tags) ? newCourse.tags : [],
        level: newCourse.level || undefined,
        popularScore: newCourse.popularScore,
        visible: newCourse.visible,
        createdAt: newCourse.createdAt.toISOString(),
        updatedAt: newCourse.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    console.error("Failed to create course:", error);
    return NextResponse.json(
      { error: "강좌 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 강좌 수정
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
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle || null;
    if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail || null;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.instructor !== undefined) updateData.instructor = updates.instructor || null;
    if (updates.courseUrl !== undefined) updateData.courseUrl = updates.courseUrl || null;
    if (updates.price !== undefined) updateData.price = updates.price ? updates.price : null;
    if (updates.duration !== undefined) updateData.duration = updates.duration || null;
    if (updates.tags !== undefined) updateData.tags = Array.isArray(updates.tags) ? updates.tags : [];
    if (updates.level !== undefined) updateData.level = updates.level || null;
    if (updates.popularScore !== undefined) updateData.popularScore = Number(updates.popularScore) || 0;
    if (updates.visible !== undefined) updateData.visible = Boolean(updates.visible);

    const updatedCourse = await prisma.academyCourse.update({
      where: { courseId: id },
      data: updateData,
    });

    return NextResponse.json({
      course: {
        id: updatedCourse.courseId,
        title: updatedCourse.title,
        description: updatedCourse.description || undefined,
        subtitle: updatedCourse.subtitle || undefined,
        thumbnail: updatedCourse.thumbnail || undefined,
        category: updatedCourse.category,
        instructor: updatedCourse.instructor || undefined,
        courseUrl: updatedCourse.courseUrl || undefined,
        price: updatedCourse.price ? Number(updatedCourse.price) : null,
        duration: updatedCourse.duration || undefined,
        tags: Array.isArray(updatedCourse.tags) ? updatedCourse.tags : [],
        level: updatedCourse.level || undefined,
        popularScore: updatedCourse.popularScore,
        visible: updatedCourse.visible,
        createdAt: updatedCourse.createdAt.toISOString(),
        updatedAt: updatedCourse.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "강좌를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { error: "강좌 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 강좌 삭제
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

    await prisma.academyCourse.delete({
      where: { courseId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 401 });
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "강좌를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { error: "강좌 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

