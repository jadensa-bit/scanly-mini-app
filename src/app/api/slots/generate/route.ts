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
      console.error(`❌ No site config found for handle: ${handle}`);
      return jsonError("Site not found or no config", 404);
    }

    console.log(`📋 Site config for ${handle}:`, {
      hasAvailability: !!siteConfig.availability,
      mode: siteConfig.mode,
      timezone: siteConfig.availability?.timezone,
    });

    if (!siteConfig.availability) {
      console.error(`❌ No availability config for handle: ${handle}`);
      return jsonError("Availability not configured for this Piqo", 400, {
        message: "The creator hasn't set up business hours yet",
      });
    }

    const availability = siteConfig.availability;
    const slotMinutes = availability.slotMinutes || 60;
    const bufferMinutes = availability.bufferMinutes || 0;
    const leadTime = availability.leadTime || 0; // Hours
    const timezone = availability.timezone || 'America/New_York';
    const days = availability.days || {};

    // 🔍 DEBUG: Log complete availability structure
    console.log(`🔍 FULL AVAILABILITY CONFIG:`, JSON.stringify(availability, null, 2));
    console.log(`🔍 DAYS STRUCTURE:`, JSON.stringify(days, null, 2));
    
    console.log(`✅ Generating slots with config:`, {
      slotMinutes,
      bufferMinutes,
      leadTime,
      timezone,
      enabledDays: Object.entries(days).filter(([_, d]: [string, any]) => d.enabled).map(([k]) => k),
      daysKeys: Object.keys(days),
    });

    // Calculate minimum booking time (now + leadTime)
    const minBookingTime = new Date();
    minBookingTime.setHours(minBookingTime.getHours() + leadTime);

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

      console.log(`📅 Processing date ${current.toISOString().split('T')[0]} (${dayName}):`, {
        dayName,
        dayOfWeek: current.getDay(),
        hasDayConfig: !!dayConfig,
        enabled: dayConfig?.enabled,
        start: dayConfig?.start,
        end: dayConfig?.end,
      });

      if (dayConfig?.enabled && dayConfig.start && dayConfig.end) {
        const [startHour, startMin] = (dayConfig.start || "09:00").split(":").map(Number);
        const [endHour, endMin] = (dayConfig.end || "17:00").split(":").map(Number);

        console.log(`  ⏰ Time range: ${dayConfig.start} (${startHour}:${startMin}) to ${dayConfig.end} (${endHour}:${endMin})`);

        let slotStart = new Date(current);
        slotStart.setHours(startHour, startMin, 0, 0);

        let slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

        const dayEnd = new Date(current);
        dayEnd.setHours(endHour, endMin, 0, 0);

        console.log(`  📏 Day window: ${slotStart.toISOString()} to ${dayEnd.toISOString()}`);
        console.log(`  ⏱️  Slot duration: ${slotMinutes} min, Buffer: ${bufferMinutes} min`);
        console.log(`  🕐 Min booking time (leadTime): ${minBookingTime.toISOString()}`);

        let slotsForThisDay = 0;
        let skippedByLeadTime = 0;

        // Create slots for this day
        while (slotEnd <= dayEnd) {
          // Only include slots that are after the minimum booking time (leadTime)
          if (slotStart >= minBookingTime) {
            slots.push({
              creator_handle: handle,
              start_time: slotStart.toISOString(),
              end_time: slotEnd.toISOString(),
              is_booked: false,
            });
            slotsForThisDay++;
          } else {
            skippedByLeadTime++;
          }

          // Add buffer time between slots
          slotStart = new Date(slotEnd);
          slotStart.setMinutes(slotStart.getMinutes() + bufferMinutes);
          slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
        }

        console.log(`  ✅ Generated ${slotsForThisDay} slots for this day (skipped ${skippedByLeadTime} due to leadTime)`);
      } else {
        console.log(`  ⏭️  Skipping this day - not enabled or missing start/end times`);
      }

      current.setDate(current.getDate() + 1);
    }

    console.log(`✅ Generated ${slots.length} slots for ${handle}`);

    if (slots.length === 0) {
      console.warn(`⚠️ No slots generated - check availability settings or leadTime`);
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
      console.error("❌ Error inserting slots:", error);
      return jsonError("Failed to generate slots", 500, { detail: error.message });
    }

    console.log(`✅ Successfully inserted ${slots.length} slots for ${handle}`);
    console.log(`📅 Slot time range: ${slots[0]?.start_time} to ${slots[slots.length - 1]?.end_time}`);
    
    // 🔍 DEBUG: Verify slots were actually inserted by querying immediately after
    const { data: verifySlots, error: verifyError } = await supabase
      .from("slots")
      .select("id")
      .eq("creator_handle", handle)
      .limit(5);
    
    console.log(`🔍 VERIFICATION: Querying slots immediately after insert using SERVICE ROLE:`, {
      found: verifySlots?.length || 0,
      error: verifyError?.message
    });

    return NextResponse.json({
      ok: true,
      message: `Generated ${slots.length} slots for ${handle}`,
      slotsCount: slots.length,
      firstSlot: slots[0]?.start_time,
      lastSlot: slots[slots.length - 1]?.end_time,
    });
  } catch (err: any) {
    console.error("❌ Slot generation error:", err);
    return jsonError(err.message || "Internal error", 500);
  }
}
