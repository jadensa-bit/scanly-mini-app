// Delete booking API endpoint
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Use service role to delete
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, get the booking to find the slot_id so we can unbook it
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('slot_id')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('❌ Failed to delete booking:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Mark the slot as available again if it has a slot_id
    if (booking.slot_id) {
      const { error: slotError } = await supabase
        .from('slots')
        .update({ is_booked: false })
        .eq('id', booking.slot_id);

      if (slotError) {
        console.warn('⚠️ Failed to unbook slot:', slotError.message);
      } else {
        console.log(`✅ Slot ${booking.slot_id} marked as available again`);
      }
    }

    console.log(`✅ Booking ${bookingId} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Booking deleted' });
  } catch (err: any) {
    console.error('❌ Delete booking error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
