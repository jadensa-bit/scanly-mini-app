/**
 * API endpoint to create Stripe checkout session for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { tier = 'pro', returnUrl } = body;

    if (!['pro', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get user profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    // Define pricing based on tier
    const prices = {
      pro: {
        amount: 1500, // $15/month in cents
        name: 'Pro Plan',
        description: 'Unlimited piqos + advanced features',
      },
      enterprise: {
        amount: 4900, // $49/month in cents
        name: 'Enterprise Plan',
        description: 'Everything in Pro + priority support',
      },
    };

    const selectedPlan = prices[tier as keyof typeof prices];

    // Get or create Stripe customer
    let customerId = profile?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}${returnUrl || '/create'}?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}${returnUrl || '/pricing'}?upgrade=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        subscription_tier: tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          subscription_tier: tier,
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
