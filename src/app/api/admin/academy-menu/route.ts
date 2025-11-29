// app/api/admin/academy-menu/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "academy-menu.json");

async function readMenu() {
  try {
    const txt = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(txt);
  } catch {
    const fallback = [
      { id: "all", name: "전체", slug: "all", order: 0, visible: true },
      { id: "certificate", name: "자격증", slug: "certificate", order: 1, visible: true },
      { id: "self-development", name: "자기계발", slug: "self-development", order: 2, visible: true },
      { id: "health", name: "건강", slug: "health", order: 3, visible: true },
      { id: "hobby", name: "취미", slug: "hobby", order: 4, visible: true },
      { id: "technology", name: "기술", slug: "technology", order: 5, visible: true },
      { id: "language", name: "언어", slug: "language", order: 6, visible: true },
      { id: "business", name: "비즈니스", slug: "business", order: 7, visible: true },
    ];
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export async function GET() {
  const data = await readMenu();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "배열 형태가 필요합니다." }, { status: 400 });
    }
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

