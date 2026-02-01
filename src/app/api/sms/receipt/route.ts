/**
 * API endpoint to send SMS receipts
 * Called after successful checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendReceipt, formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      customerPhone, 
      customerName,
      storeName,
      storeHandle,
    } = body;

    if (!orderId || !customerPhone) {
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

    // Get order details from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse order items
    const items = Array.isArray(order.items) ? order.items : [];
    
    // Send SMS receipt
    const sent = await sendReceipt({
      customerName: customerName || 'Valued Customer',
      customerPhone: formatPhoneNumber(customerPhone),
      items: items.map((item: any) => ({
        name: item.name || item.title || 'Item',
        price: parseFloat(item.price || 0),
        quantity: parseInt(item.quantity || 1),
      })),
      total: parseFloat(order.total || 0),
      storeName: storeName || 'Store',
      storeHandle: storeHandle || '',
      orderNumber: order.order_number || orderId.slice(-8).toUpperCase(),
      date: new Date(order.created_at),
    });

    if (sent) {
      // Update order to mark SMS sent
      await supabase
        .from('orders')
        .update({ sms_receipt_sent: true, sms_sent_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    return NextResponse.json({ 
      success: sent,
      message: sent ? 'SMS receipt sent' : 'SMS disabled or failed',
    });

  } catch (error) {
    console.error('Error in SMS receipt API:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS receipt' },
      { status: 500 }
    );
  }
}
