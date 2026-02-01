/**
 * API endpoint to create Stripe checkout session for tips
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      handle, 
      amount,  // in dollars
      tipperName, 
      tipperEmail,
      tipperPhone,
      message 
    } = body;

    if (!handle || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid amount' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get site info for Stripe account
    const { data: site, error: siteError } = await supabase
      .from('scanly_sites')
      .select('user_id, stripe_account_id, config')
      .eq('handle', handle)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    if (!site.stripe_account_id) {
      return NextResponse.json(
        { error: 'Payment processing not set up for this site' },
        { status: 400 }
      );
    }

    const amountCents = Math.round(amount * 100);
    const brandName = site.config?.brandName || handle;

    // Create tip record
    const { data: tip, error: tipError } = await supabase
      .from('tips')
      .insert({
        handle,
        user_id: site.user_id,
        amount_cents: amountCents,
        currency: 'usd',
        tipper_name: tipperName || null,
        tipper_email: tipperEmail || null,
        tipper_phone: tipperPhone || null,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (tipError || !tip) {
      return NextResponse.json(
        { error: 'Failed to create tip record' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for ${brandName}`,
              description: message ? `"${message}"` : 'Thank you for your support!',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        handle,
        tip_id: tip.id,
        tipper_name: tipperName || '',
        tipper_phone: tipperPhone || '',
      },
      customer_email: tipperEmail || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/${handle}/tip-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/${handle}/tips`,
      payment_intent_data: {
        application_fee_amount: Math.round(amountCents * 0.05), // 5% platform fee
        transfer_data: {
          destination: site.stripe_account_id,
        },
      },
    });

    // Update tip with session ID
    await supabase
      .from('tips')
      .update({ stripe_session_id: session.id })
      .eq('id', tip.id);

    return NextResponse.json({
      success: true,
      url: session.url,
      tipId: tip.id,
    });

  } catch (error: any) {
    console.error('Tip checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
