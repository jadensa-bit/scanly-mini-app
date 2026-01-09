import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const f = form.get("file") as File | null;
    if (!f) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const id = Date.now().toString();
    const safeName = (f.name || id).replace(/[^a-zA-Z0-9._-]/g, "-");
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";

    const filename = `${id}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const outPath = path.join(uploadsDir, filename);

    // write a medium/resized image and a small thumb
    await sharp(buffer).resize(800, 800, { fit: "cover" }).toFile(outPath);

    const thumbName = `${id}-thumb-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const thumbPath = path.join(uploadsDir, thumbName);
    await sharp(buffer).resize(160, 160, { fit: "cover" }).toFile(thumbPath);

    const url = `/uploads/${filename}`;
    const thumb = `/uploads/${thumbName}`;

    return NextResponse.json({ url, thumb });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
