export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const handle = (body?.handle || "").toString();
    const mode = (body?.mode || "").toString();
    const item_title = (body?.item_title || "").toString();
    const item_price = (body?.item_price || "").toString();

    if (!handle || !item_title) {
      return NextResponse.json(
        { error: "Missing required fields: handle, item_title" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scanly_orders") // ✅ your real table name
      .insert([
        {
          handle,
          mode: mode || null,
          item_title,
          item_price: item_price || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (err) {
    console.error("API /api/orders error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
