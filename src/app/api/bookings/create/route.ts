// Booking creation API endpoint
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseclient';

export async function POST(req: Request) {
  const { slot_id, customer_name, customer_email } = await req.json();
  // use the already initialized supabase client
  // Create a booking for a slot
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ slot_id, customer_name, customer_email }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, booking: data });
}
