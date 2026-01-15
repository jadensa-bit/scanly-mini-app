import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    console.log('Upload API called');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const form = await req.formData();
    const f = form.get("file") as File | null;
    if (!f) {
      console.error('No file provided in form data');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('Processing file:', f.name, 'Size:', f.size);

    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const id = Date.now().toString();
    const safeName = (f.name || id).replace(/[^a-zA-Z0-9._-]/g, "-");
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";

    const filename = `${id}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Process images with Sharp
    console.log('Resizing image...');
    const resizedBuffer = await sharp(buffer).resize(800, 800, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
    const thumbBuffer = await sharp(buffer).resize(160, 160, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filename, resizedBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const thumbName = `${id}-thumb-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('uploads')
      .upload(thumbName, thumbBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (thumbError) {
      console.error('Thumb upload error:', thumbError);
      // Continue anyway, main image uploaded successfully
    }

    // Get public URLs
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filename);

    const { data: thumbUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(thumbName);

    const url = urlData.publicUrl;
    const thumb = thumbUrlData.publicUrl;

    console.log('Upload successful:', { url, thumb });
    return NextResponse.json({ url, thumb });
  } catch (err: any) {
    console.error('Upload API error:', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
