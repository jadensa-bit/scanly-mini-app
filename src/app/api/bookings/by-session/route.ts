export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    const sessionId = (searchParams.get("session_id") || "").trim();
    if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const { data, error } = await supabase
      .from("bookings")
      .select("id, handle, status, customer_name, customer_email, start_time, end_time, item_title, amount_cents, currency")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, booking: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
