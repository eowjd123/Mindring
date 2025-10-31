// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const id = (form.get("id") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    // sanitize filename
    const orig = file.name || "upload.pdf";
    const base = (id ?? orig).replace(/[^a-zA-Z0-9._-]/g, "-");
    const targetName = base.endsWith(path.extname(orig)) ? base : `${base}${path.extname(orig)}`;

    const publicDir = path.join(process.cwd(), "public", "resources");
    await fs.mkdir(publicDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const targetPath = path.join(publicDir, targetName);
    await fs.writeFile(targetPath, buffer);

    const publicUrl = `/resources/${targetName}`;
    return NextResponse.json({ ok: true, url: publicUrl, filename: targetName });
  } catch (e) {
    console.error("Upload error", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}


