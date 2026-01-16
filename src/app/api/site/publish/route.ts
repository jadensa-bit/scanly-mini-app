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
      // Get the site config to check if it's a services site
      const { data: site } = await supabase
        .from("sites")
        .select("config")
        .eq("handle", handle)
        .single();
      
      const mode = site?.config?.mode;
      if (mode === 'services' || mode === 'booking') {
        console.log(`📅 Generating slots for ${mode} site: ${handle}`);
        
        // Call generate endpoint using relative URL
        const baseUrl = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
        const slotsUrl = `${baseUrl}/api/slots/generate`;
        
        const slotsRes = await fetch(slotsUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle, daysInAdvance: 30 }),
        });
        
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          console.log(`✅ Generated ${slotsData.slotsCount || 0} slots for ${handle}`);
        } else {
          const errorText = await slotsRes.text();
          console.warn(`⚠️ Could not generate slots for ${handle}:`, errorText);
        }
      } else {
        console.log(`ℹ️ Skipping slot generation for non-services site (mode: ${mode})`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Slot generation failed (non-critical): ${err.message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
