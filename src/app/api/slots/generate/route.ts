import { NextResponse, NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.handle) {
      return jsonError("Missing handle", 400);
    }

    const handle = String(body.handle).toLowerCase();
    const daysInAdvance = Number(body.daysInAdvance) || 7;
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysInAdvance);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase credentials");
      return jsonError("Server configuration error", 500);
    }
    
    const supabase = createServiceClient(
      supabaseUrl,
      serviceKey,
      { auth: { persistSession: false } }
    );

    // Fetch the site config to get availability settings
    const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];
    let siteConfig: any = null;

    for (const table of TABLE_CANDIDATES) {
      const { data, error } = await supabase
        .from(table)
        .select("config")
        .eq("handle", handle)
        .maybeSingle();

      const msg = String(error?.message || "").toLowerCase();
      if (error && (msg.includes("does not exist") || msg.includes("relation"))) {
        continue;
      }

      if (data?.config) {
        siteConfig = data.config;
        break;
      }
    }

    if (!siteConfig) {
      return jsonError("Site not found or no config", 404);
    }

    const availability = siteConfig.availability || {
      slotMinutes: 60,
      days: {
        mon: { enabled: true, start: "09:00", end: "17:00" },
        tue: { enabled: true, start: "09:00", end: "17:00" },
        wed: { enabled: true, start: "09:00", end: "17:00" },
        thu: { enabled: true, start: "09:00", end: "17:00" },
        fri: { enabled: true, start: "09:00", end: "17:00" },
        sat: { enabled: false, start: "09:00", end: "17:00" },
        sun: { enabled: false, start: "09:00", end: "17:00" },
      },
    };
    const slotMinutes = availability.slotMinutes || 30;
    const days = availability.days || {};

    // Map database day names to JS day names
    const dayMap: Record<string, number> = {
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 0,
    };

    const slots = [];
    let current = new Date(startDate);

    // Generate slots for each day in the range
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

        // Create slots for this day
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

    if (slots.length === 0) {
      return jsonError("No slots generated - check availability settings", 400);
    }

    // Delete existing slots for this handle in the date range (optional)
    await supabase
      .from("slots")
      .delete()
      .eq("creator_handle", handle)
      .gte("start_time", startDate.toISOString())
      .lt("start_time", endDate.toISOString());

    // Insert new slots
    const { data, error } = await supabase
      .from("slots")
      .insert(slots);

    if (error) {
      console.error("Error inserting slots:", error);
      return jsonError("Failed to generate slots", 500, { detail: error.message });
    }

    return NextResponse.json({
      ok: true,
      message: `Generated ${slots.length} slots for ${handle}`,
      slotsCount: slots.length,
    });
  } catch (err: any) {
    console.error("Slot generation error:", err);
    return jsonError(err.message || "Internal error", 500);
  }
}
