// Booking slots API endpoint
import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabaseclient';


export async function GET(req: Request) {
  // use the already initialized supabase client
  // Fetch available slots for a creator/team (excluding booked slots)
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  
  try {
    // Fetch only unbooked slots
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('creator_handle', handle)
      .eq('is_booked', false)
      .order('start_time', { ascending: true });
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    console.log(`✅ Slots API: Found ${slots?.length || 0} available slots for ${handle}`);
    return NextResponse.json({ slots });
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
