import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: Request) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, piqo_limit, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get current piqo count
    const { count: piqoCount } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const tier = profile.subscription_tier || 'free';
    const status = profile.subscription_status || 'active';
    const limit = profile.piqo_limit || 1;
    const current = piqoCount || 0;

    // Define features
    const features = {
      unlimitedPiqos: tier === 'pro' || tier === 'enterprise',
      advancedAnalytics: tier === 'pro' || tier === 'enterprise',
      customBranding: tier === 'pro' || tier === 'enterprise',
      prioritySupport: tier === 'enterprise',
      whiteLabel: tier === 'enterprise',
      teamAccess: tier === 'enterprise',
    };

    return NextResponse.json({
      ok: true,
      subscription: {
        tier,
        status,
        piqoLimit: limit,
        currentPiqoCount: current,
        canCreateMore: tier === 'free' ? current < limit : true,
        features,
        stripeCustomerId: profile.stripe_customer_id,
        stripeSubscriptionId: profile.stripe_subscription_id,
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
