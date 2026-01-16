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
    
    console.log(`🚀 Publishing site: ${handle}`);
    
    if (!handle) return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });

    const { error } = await supabase
      .from("sites")
      .update({ published: true, published_at: new Date().toISOString() })
      .eq("handle", handle);

    if (error) {
      console.error(`❌ Failed to publish ${handle}:`, error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    console.log(`✅ Site ${handle} marked as published`);

    // Auto-generate slots for services/booking modes
    try {
      // Get the site config to check if it's a services site
      const { data: site } = await supabase
        .from("sites")
        .select("config")
        .eq("handle", handle)
        .single();
      
      const mode = site?.config?.mode;
      console.log(`📋 Site mode for ${handle}: ${mode}`);
      
      if (mode === 'services' || mode === 'booking') {
        console.log(`📅 Generating slots for ${mode} site: ${handle}`);
        
        // First, delete existing future slots to regenerate fresh
        const { error: deleteError } = await supabase
          .from('slots')
          .delete()
          .eq('creator_handle', handle)
          .gte('start_time', new Date().toISOString())
          .eq('is_booked', false);
        
        if (deleteError) {
          console.warn(`⚠️ Could not delete old slots: ${deleteError.message}`);
        } else {
          console.log(`🗑️ Deleted old unbooked slots for ${handle}`);
        }
        
        // Generate slots directly inline (avoid HTTP call issues)
        const daysInAdvance = 30;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + daysInAdvance);

        const availability = site?.config?.availability || {
          slotMinutes: 60,
          days: {
            mon: { enabled: true, start: "09:00", end: "17:00" },
            tue: { enabled: true, start: "09:00", end: "17:00" },
            wed: { enabled: true, start: "09:00", end: "17:00" },
            thu: { enabled: true, start: "09:00", end: "17:00" },
            fri: { enabled: true, start: "09:00", end: "17:00" },
          },
        };
        const slotMinutes = availability.slotMinutes || 30;
        const days = availability.days || {};

        const dayMap: Record<string, number> = {
          mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
        };

        const slots = [];
        let current = new Date(startDate);

        while (current < endDate) {
          const dayName = Object.keys(dayMap).find((k) => dayMap[k] === current.getDay());
          const dayConfig = dayName ? days[dayName] : null;

          if (dayConfig?.enabled && dayConfig.start && dayConfig.end) {
            const [startHour, startMin] = (dayConfig.start || "09:00").split(":").map(Number);
            const [endHour, endMin] = (dayConfig.end || "17:00").split(":").map(Number);

            let slotStart = new Date(current);
            slotStart.setHours(startHour, startMin, 0, 0);

            let slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

            const dayEnd = new Date(current);
            dayEnd.setHours(endHour, endMin, 0, 0);

            while (slotEnd <= dayEnd) {
              slots.push({
                creator_handle: handle,
                start_time: slotStart.toISOString(),
                end_time: slotEnd.toISOString(),
                is_booked: false,
              });

              slotStart = new Date(slotEnd);
              slotEnd = new Date(slotStart);
              slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
            }
          }

          current.setDate(current.getDate() + 1);
        }

        if (slots.length > 0) {
          const { error: insertError } = await supabase.from("slots").insert(slots);
          if (insertError) {
            console.error(`❌ Failed to insert slots: ${insertError.message}`);
          } else {
            console.log(`✅ Generated ${slots.length} slots for ${handle}`);
          }
        } else {
          console.log(`⚠️ No slots generated - check availability settings`);
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
