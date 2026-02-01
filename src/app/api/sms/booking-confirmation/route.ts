/**
 * API endpoint to send booking confirmation SMS
 * Called after successful booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation, formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      bookingId, 
      customerPhone, 
      customerName,
      storeName,
      storeHandle,
    } = body;

    if (!bookingId || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhoneNumber(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Get booking details from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Send SMS confirmation
    const sent = await sendBookingConfirmation({
      customerPhone: formatPhoneNumber(customerPhone),
      customerName: customerName || booking.customer_name || 'Valued Customer',
      storeName: storeName || 'Store',
      storeHandle: storeHandle || '',
      service: booking.service_name || booking.service || 'Service',
      date: new Date(booking.slot_time || booking.date),
      bookingId: bookingId.slice(-8).toUpperCase(),
    });

    if (sent) {
      // Update booking to mark SMS sent
      await supabase
        .from('bookings')
        .update({ 
          sms_confirmation_sent: true, 
          sms_confirmation_sent_at: new Date().toISOString() 
        })
        .eq('id', bookingId);
    }

    return NextResponse.json({ 
      success: sent,
      message: sent ? 'SMS confirmation sent' : 'SMS disabled or failed',
    });

  } catch (error) {
    console.error('Error in booking confirmation API:', error);
    return NextResponse.json(
      { error: 'Failed to send booking confirmation' },
      { status: 500 }
    );
  }
}
