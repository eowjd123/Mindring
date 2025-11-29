import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { checkAdminPermission } from "@/lib/require-admin";
import { promises as fs } from "fs";
import path from "path";

const GROUPS_FILE = path.join(process.cwd(), "data", "coloring-groups.json");

async function readGroups() {
  try {
    const data = await fs.readFile(GROUPS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveGroups(groups: any[]) {
  await fs.mkdir(path.dirname(GROUPS_FILE), { recursive: true });
  await fs.writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2), "utf8");
}

// GET: 그룹 목록 조회
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

    const groups = await readGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Admin coloring groups GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 그룹 생성
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

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "그룹 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const groups = await readGroups();
    
    // ID 생성
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // 중복 체크
    if (groups.some((g: any) => g.id === sanitizedName)) {
      return NextResponse.json(
        { error: "이미 존재하는 그룹 이름입니다." },
        { status: 400 }
      );
    }

    const newGroup = {
      id: sanitizedName,
      name: name,
      description: description || "",
      order: groups.length,
      createdAt: new Date().toISOString(),
    };

    groups.push(newGroup);
    await saveGroups(groups);

    return NextResponse.json({
      message: "그룹이 성공적으로 생성되었습니다.",
      group: newGroup,
    });
  } catch (error) {
    console.error("Admin coloring groups POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

