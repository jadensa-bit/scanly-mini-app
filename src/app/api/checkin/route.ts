// QR check-in API endpoint
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseclient';

export async function POST(req: Request) {
  const { bookingId, qrCode } = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Validate booking and mark as checked-in
  const { data, error } = await supabase
    .from('bookings')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('qr_code', qrCode)
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, booking: data });
}
