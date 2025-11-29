import { NextResponse } from "next/server";
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

// GET: 그룹 목록 조회 (공개 API)
export async function GET() {
  try {
    const groups = await readGroups();
    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Coloring groups GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

