// Booking slots API endpoint
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { supabase } from '@/lib/supabaseclient';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey, { auth: { persistSession: false } });
}

const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];

async function findSiteByHandle(supabase: any, handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select("*").eq("handle", handle).maybeSingle();
    const msg = String(error?.message || "").toLowerCase();
    if (error && (msg.includes("does not exist") || msg.includes("relation"))) continue;
    if (error) return { table, data: null, error };
    if (data) return { table, data, error: null };
  }
  return { table: null, data: null, error: null };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  
  if (!handle) {
    return NextResponse.json({ ok: false, error: 'Missing handle' }, { status: 400 });
  }
  
  try {
    // First, check if this is a Services Piqo with availability configured
    const adminSupabase = getSupabase();
    const siteResult = await findSiteByHandle(adminSupabase, handle);
    
    if (!siteResult.data) {
      console.log(`⚠️ No Piqo found for handle: ${handle}`);
      return NextResponse.json({ 
        ok: false, 
        reason: 'PIQO_NOT_FOUND',
        slots: [] 
      }, { status: 404 });
    }
    
    const config = siteResult.data.config;
    const mode = config?.mode;
    const availability = config?.availability;
    
    console.log(`📋 Checking slots for ${handle}:`, {
      mode,
      hasAvailability: !!availability,
      enabledDays: availability?.days ? Object.entries(availability.days).filter(([_, d]: [string, any]) => d.enabled).map(([k]) => k) : [],
    });
    
    // Check if this is a Services mode Piqo
    if (mode !== 'services') {
      console.log(`⚠️ Handle ${handle} is not a services Piqo (mode: ${mode})`);
      return NextResponse.json({ 
        ok: false, 
        reason: 'NOT_SERVICES_MODE',
        message: 'This is not a services booking page',
        slots: [] 
      }, { status: 400 });
    }
    
    // Check if availability is configured
    if (!availability || !availability.days) {
      console.log(`⚠️ Handle ${handle} has no availability configured`);
      return NextResponse.json({ 
        ok: false, 
        reason: 'MISSING_AVAILABILITY',
        message: 'Business hours not configured yet',
        slots: [] 
      }, { status: 200 });
    }
    
    const hasEnabledDays = Object.values(availability.days).some((day: any) => day?.enabled);
    if (!hasEnabledDays) {
      console.log(`⚠️ Handle ${handle} has no enabled days`);
      return NextResponse.json({ 
        ok: false, 
        reason: 'NO_ENABLED_DAYS',
        message: 'No business hours enabled',
        slots: [] 
      }, { status: 200 });
    }
    
    // Fetch available slots from the slots table using SERVICE ROLE to bypass RLS
    const { data: slots, error } = await adminSupabase
      .from('slots')
      .select('*')
      .eq('creator_handle', handle)
      .eq('is_booked', false)
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error(`❌ Error fetching slots for ${handle}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // 🔍 DEBUG: Check all slots for this handle (even booked ones)
    const { data: allSlots, error: allError } = await adminSupabase
      .from('slots')
      .select('*')
      .eq('creator_handle', handle)
      .limit(5);
    console.log(`🔍 Total slots in DB for ${handle}:`, allSlots?.length || 0);
    if (allSlots && allSlots.length > 0) {
      console.log(`🔍 Sample slot:`, allSlots[0]);
    }
    
    console.log(`✅ Slots API: Found ${slots?.length || 0} available slots for ${handle}`);
    return NextResponse.json({ ok: true, slots: slots || [] });
  } catch (err: any) {
    console.error('❌ Slots API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const { creator_handle, start_time, end_time, team_member_id } = await req.json();
  // use the already initialized supabase client
  // Add a new slot
  const { data, error } = await supabase
    .from('slots')
    .insert([{ creator_handle, start_time, end_time, team_member_id }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, slot: data });
}
