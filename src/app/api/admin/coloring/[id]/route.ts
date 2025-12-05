import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";
import { promises as fs } from "fs";
import path from "path";

const COLORING_DIR = path.join(process.cwd(), "public", "img", "coloring");
const TEMPLATES_FILE = path.join(process.cwd(), "data", "coloring-templates.json");

async function readTemplates() {
  try {
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTemplates(templates: any[]) {
  await fs.mkdir(path.dirname(TEMPLATES_FILE), { recursive: true });
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

// DELETE: 도안 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminPermission(user.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const templates = await readTemplates();
    const template = templates.find((t: any) => t.id === id);

    if (!template) {
      return NextResponse.json(
        { error: "도안을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미지 파일 삭제
    try {
      const originalPath = path.join(
        process.cwd(),
        "public",
        template.original
      );
      const outlinePath = path.join(process.cwd(), "public", template.outline);
      await fs.unlink(originalPath).catch(() => {});
      await fs.unlink(outlinePath).catch(() => {});
    } catch (error) {
      console.error("File deletion error:", error);
      // 파일 삭제 실패해도 계속 진행
    }

    // 목록에서 제거
    const updatedTemplates = templates.filter((t: any) => t.id !== id);
    await saveTemplates(updatedTemplates);

    return NextResponse.json({
      message: "도안이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Admin coloring DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

