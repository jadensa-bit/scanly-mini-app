// Booking slots API endpoint
import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabaseclient';


export async function GET(req: Request) {
  // use the already initialized supabase client
  // Fetch available slots for a creator/team
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const { data: slots, error } = await supabase
    .from('slots')
    .select('*')
    .eq('creator_handle', handle)
    .order('start_time', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots });
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
