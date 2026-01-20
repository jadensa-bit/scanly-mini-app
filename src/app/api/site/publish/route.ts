import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL in .env.local");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const TABLE_CANDIDATES = ["scanly_sites", "sites", "site"];

async function findSiteByHandle(supabase: any, handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select("*").eq("handle", handle).maybeSingle();
    const msg = String(error?.message || "").toLowerCase();
    if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      continue;
    }
    if (error) return { table, data: null, error };
    if (data) return { table, data, error: null };
  }
  return { table: null, data: null, error: null };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { handle, config } = await req.json();
    
    console.log(`🚀 Publishing site: ${handle}`, config ? '(with new config)' : '(existing site)');
    
    if (!handle) return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });

    // ✅ NEW PIQO: If config is passed, this is a first-time publish
    // Create the site with config + user_id + published_at
    if (config) {
      console.log(`✨ Creating new piqo: ${handle}`);
      
      // Get authenticated user
      const { createClient } = await import("@/lib/supabase/server");
      const serverSupabase = await createClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      
      if (!user) {
        console.error(`❌ No authenticated user for new piqo`);
        return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
      }
      
      // Extract owner email from config
      const owner_email = String(config?.notifications?.email ?? config?.ownerEmail ?? "").trim() || null;
      
      // Try each table to create the site
      for (const table of TABLE_CANDIDATES) {
        const payload = {
          handle,
          config,
          user_id: user.id,
          owner_email,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log(`📋 Inserting into ${table}:`, { handle, user_id: user.id });
        
        const { data, error } = await supabase
          .from(table)
          .insert(payload)
          .select("handle")
          .maybeSingle();
        
        const msg = String(error?.message || "").toLowerCase();
        
        // Table doesn't exist → try next
        if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
          console.log(`⏭️ Table ${table} doesn't exist, trying next...`);
          continue;
        }
        
        // Unique constraint violation is expected for handle conflicts
        if (error && msg.includes("unique")) {
          console.error(`❌ Handle ${handle} already exists`);
          return NextResponse.json({ ok: false, error: "Handle already taken" }, { status: 409 });
        }
        
        // Other errors
        if (error) {
          console.error(`❌ Failed to create in ${table}:`, error);
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
        
        // Success!
        console.log(`✅ New piqo created in ${table}: ${handle}`);
        
        // Auto-generate slots for services/booking modes
        const mode = config?.mode;
        if (mode === 'services' || mode === 'booking') {
          console.log(`📅 Generating slots for ${mode} site: ${handle}`);
          
          const daysInAdvance = 30;
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + daysInAdvance);

          const availability = config?.availability || {
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
            const { error: slotError } = await supabase.from('slots').insert(slots);
            if (slotError) {
              console.warn(`⚠️ Could not insert slots: ${slotError.message}`);
            } else {
              console.log(`✅ Generated ${slots.length} slots for ${handle}`);
            }
          }
        }
        
        return NextResponse.json({ 
          ok: true, 
          handle,
          publishedAt: payload.published_at,
          message: "Site published successfully" 
        });
      }
      
      // If we get here, no table worked
      console.error(`❌ Could not find a valid table to create site`);
      return NextResponse.json({ ok: false, error: "Database configuration error" }, { status: 500 });
    }

    // ✅ EXISTING PIQO: Find and publish the draft
    // Find the site in any table
    const siteResult = await findSiteByHandle(supabase, handle);
    
    if (!siteResult.data || !siteResult.table) {
      console.error(`❌ Site not found for ${handle}`);
      return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
    }

    const site = siteResult.data;
    const tableName = siteResult.table;
    
    console.log(`📋 Found site in table: ${tableName}`);

    // If there's a draft_config, copy it to config (publish the draft)
    // If there's no draft, just mark as published
    const updateData: any = { 
      published_at: new Date().toISOString() 
    };
    
    if (site.draft_config) {
      console.log(`📋 Publishing draft changes for ${handle}`);
      updateData.config = site.draft_config;
      updateData.draft_config = null; // Clear draft after publishing
    } else {
      console.log(`📋 No draft found, just marking ${handle} as published`);
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("handle", handle);

    if (error) {
      console.error(`❌ Failed to publish ${handle}:`, error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    console.log(`✅ Site ${handle} ${site.draft_config ? 'published with draft changes' : 'marked as published'}`);

    // Auto-generate slots for services/booking modes
    try {
      // Use the updated config (after publish) to check if it's a services site
      const { data: updatedSite } = await supabase
        .from(tableName)
        .select("config")
        .eq("handle", handle)
        .single();
      
      const mode = updatedSite?.config?.mode;
      console.log(`📋 Site mode for ${handle}: ${mode}`);
      
      if (mode === 'services' || mode === 'booking') {
        console.log(`📅 Generating slots for ${mode} site: ${handle}`);
        
        // Delete only UNBOOKED future slots to regenerate fresh availability
        // ✅ This preserves all bookings (stored in bookings table)
        // ✅ This preserves all booked slots (is_booked = true)
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

        const availability = updatedSite?.config?.availability || {
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
