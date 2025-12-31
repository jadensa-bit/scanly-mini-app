// src/app/api/publish/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeHandle(h: unknown) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const handle = normalizeHandle(body?.handle);

    if (!handle) {
      return NextResponse.json({ error: "Missing handle." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // 1) load current config
    const { data: row, error: selErr } = await supabase
      .from("sites")
      .select("handle, config")
      .eq("handle", handle)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 400 });
    }

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingCfg = (row as any).config ?? {};
    const publishedAt = new Date().toISOString();

    const nextCfg = {
      ...existingCfg,
      handle, // keep it consistent
      active: true,
      publishedAt, // store publish timestamp INSIDE config (safe)
    };

    // 2) write back
    const { error: updErr } = await supabase
      .from("sites")
      .update({ config: nextCfg })
      .eq("handle", handle);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, handle, publishedAt });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Publish failed.", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
