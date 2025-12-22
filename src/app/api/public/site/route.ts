export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string) => (process.env[key] ?? "").trim();

const supabase = createClient(
  getEnv("SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const handle = String(url.searchParams.get("handle") || "")
      .trim()
      .toLowerCase();

    if (!handle) {
      return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    }

    const { data: site, error } = await supabase
      .from("scanly_sites")
      .select("handle, mode, brand_name, tagline, items, stripe_account_id")
      .eq("handle", handle)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to load site", detail: error.message }, { status: 500 });
    }

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, site });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load site", detail: e?.message || String(e) }, { status: 500 });
  }
}
