// Booking creation API endpoint
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseclient';

export async function POST(req: Request) {
  const { handle, slot_id, team_member_id, customer_name, customer_email, item_title } = await req.json();
  
  try {
    // Create a booking for a slot
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ handle, slot_id, team_member_id, customer_name, customer_email, item_title }]);
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    
    // Mark the slot as booked
    if (slot_id) {
      const { error: slotError } = await supabase
        .from('slots')
        .update({ is_booked: true })
        .eq('id', slot_id);
      
      if (slotError) {
        console.warn('⚠️ Failed to mark slot as booked:', slotError.message);
      } else {
        console.log(`✅ Slot ${slot_id} marked as booked`);
      }
    }
    
    return NextResponse.json({ success: true, booking: data });
  } catch (err: any) {
    console.error('❌ Booking creation error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

