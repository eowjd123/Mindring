import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const TEMPLATES_FILE = path.join(process.cwd(), "data", "coloring-templates.json");

async function readTemplates() {
  try {
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    // 파일이 없으면 빈 배열 반환
    return [];
  }
}

// GET: 도안 목록 조회 (공개 API)
export async function GET() {
  try {
    const templates = await readTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Coloring templates GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

