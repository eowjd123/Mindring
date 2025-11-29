import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";
import { promises as fs } from "fs";
import path from "path";

const COLORING_DIR = path.join(process.cwd(), "public", "img", "coloring");
const TEMPLATES_FILE = path.join(process.cwd(), "data", "coloring-templates.json");

// 도안 목록 읽기
async function readTemplates() {
  try {
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    // 파일이 없으면 빈 배열 반환
    return [];
  }
}

// 도안 목록 저장
async function saveTemplates(templates: any[]) {
  await fs.mkdir(path.dirname(TEMPLATES_FILE), { recursive: true });
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

// GET: 도안 목록 조회
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminPermission(user.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templates = await readTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Admin coloring GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 도안 업로드
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminPermission(user.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const originalFile = formData.get("original") as File;
    const outlineFile = formData.get("outline") as File;
    const paletteJson = formData.get("palette") as string | null;

    if (!name || !originalFile || !outlineFile) {
      return NextResponse.json(
        { error: "모든 필드가 필요합니다." },
        { status: 400 }
      );
    }

    // 디렉토리 생성
    await fs.mkdir(COLORING_DIR, { recursive: true });

    // 파일명 생성 (한글 이름을 영문으로 변환)
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const originalFileName = `${sanitizedName}-original.png`;
    const outlineFileName = `${sanitizedName}-outline.png`;

    // 파일 저장
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    const outlineBuffer = Buffer.from(await outlineFile.arrayBuffer());

    await fs.writeFile(
      path.join(COLORING_DIR, originalFileName),
      originalBuffer
    );
    await fs.writeFile(
      path.join(COLORING_DIR, outlineFileName),
      outlineBuffer
    );

    // 그룹 정보 가져오기
    let groupName = undefined;
    const groupId = formData.get("groupId") as string;
    if (groupId) {
      try {
        const groupsFile = path.join(process.cwd(), "data", "coloring-groups.json");
        const groupsData = await fs.readFile(groupsFile, "utf8");
        const groups = JSON.parse(groupsData);
        const group = groups.find((g: any) => g.id === groupId);
        if (group) {
          groupName = group.name;
        }
      } catch {
        // 그룹 파일이 없으면 무시
      }
    }

    // 팔레트 파싱
    let palette = undefined;
    if (paletteJson) {
      try {
        palette = JSON.parse(paletteJson);
      } catch {
        // 파싱 실패 시 무시
      }
    }

    // 도안 목록에 추가
    const templates = await readTemplates();
    const newTemplate = {
      id: sanitizedName,
      name: name,
      groupId: groupId || undefined,
      groupName: groupName,
      original: `/img/coloring/${originalFileName}`,
      outline: `/img/coloring/${outlineFileName}`,
      palette: palette || undefined,
      createdAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    await saveTemplates(templates);

    return NextResponse.json({
      message: "도안이 성공적으로 업로드되었습니다.",
      template: newTemplate,
    });
  } catch (error) {
    console.error("Admin coloring POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

