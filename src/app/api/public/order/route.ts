export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mustEnv(key: string) {
  const v = (process.env[key] ?? "").trim();
  if (!v) throw new Error(`${key} is missing.`);
  return v;
}

const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// GET /api/public/order?order=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order");
    if (!orderId) return NextResponse.json({ ok: false, error: "Missing order id" }, { status: 400 });

    const { data, error } = await supabase
      .from("scanly_orders")
      .select(
        "id, handle, mode, item_title, item_price, customer_name, customer_email, customer_phone, booking_date, booking_time, booking_location, notes, address, variant, status, paid, created_at"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: "Supabase error", detail: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, order: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Server error", detail: e?.message || String(e) }, { status: 500 });
  }
}
