// app/api/admin/activities-menu/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "activities-menu.json");

async function readMenu() {
  try {
    const txt = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(txt);
  } catch {
    const fallback = [
      { id: "all", name: "전체", slug: "all", order: 0, visible: true },
      { id: "art", name: "미술", slug: "art", order: 1, visible: true },
      { id: "cook", name: "요리", slug: "cook", order: 2, visible: true },
      { id: "exercise", name: "운동", slug: "exercise", order: 3, visible: true },
      { id: "music", name: "음악", slug: "music", order: 4, visible: true },
      { id: "language", name: "언어", slug: "language", order: 5, visible: true },
      { id: "science", name: "수/과학", slug: "science", order: 6, visible: true },
      { id: "cognitive", name: "인지훈련", slug: "cognitive", order: 7, visible: true },
      { id: "season", name: "계절/행사", slug: "season", order: 8, visible: true },
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


