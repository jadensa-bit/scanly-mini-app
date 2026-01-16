import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL in .env.local");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { handle } = await req.json();
    if (!handle) return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });

    const { error } = await supabase
      .from("sites")
      .update({ published: true, published_at: new Date().toISOString() })
      .eq("handle", handle);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Auto-generate slots for services/booking modes
    try {
      const slotsRes = await fetch(new URL("/api/slots/generate", process.env.NEXTAUTH_URL || "http://localhost:3000").toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, daysInAdvance: 30 }),
      });
      
      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        console.log(`✅ Generated ${slotsData.slotsCount} slots for ${handle}`);
      } else {
        console.warn(`⚠️ Could not generate slots: ${await slotsRes.text()}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Slot generation failed (non-critical): ${err.message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
