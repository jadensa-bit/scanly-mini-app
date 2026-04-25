# piqo Pro One-Time Upgrade System

This guide explains the new $15 one-time upgrade system that allows piqo creators to upgrade from their profile to piqo Pro.

## Overview

The upgrade system enables:
- ✨ One-time $15 payment (not recurring) to become piqo Pro
- 🌍 Unlimited piqo storefronts (instead of just 1 free)
- 📊 Advanced analytics and features
- 💳 Secure Stripe checkout from profile page

## Setup Instructions

### 1. Configure Stripe Keys

Add these to `.env.local`:

```bash
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URL (for Stripe success/cancel redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-app.com/api/webhooks/stripe`
4. Events to listen: 
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
5. Copy the "Signing secret" to `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 3. Database Migration

The system uses these `profiles` table columns (already created by migration #12):

```sql
subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
subscription_status TEXT DEFAULT 'active'
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_start_date TIMESTAMPTZ
subscription_end_date TIMESTAMPTZ
piqo_limit INTEGER DEFAULT 1
```

If the migration hasn't run, apply it:
```bash
npx supabase migration up 12
```

## How It Works

### User Upgrade Flow

1. **User navigates to Profile** (`/profile`)
2. **Views Subscription Section** showing:
   - Current tier (Free/Pro/Enterprise)
   - Pro features list
   - "Upgrade to Pro - $15" button
3. **Clicks Upgrade Button**
   - Calls `/api/subscription/upgrade` endpoint
   - Creates Stripe checkout session
   - Redirects user to Stripe checkout page
4. **Completes Payment**
   - User enters card details (test: 4242 4242 4242 4242)
   - Stripe confirms payment
5. **Webhook Processes Payment**
   - Stripe sends `checkout.session.completed` event
   - Our webhook handler at `/api/webhooks/stripe` receives it
   - Updates user's profile:
     - `subscription_tier = 'pro'`
     - `piqo_limit = 999` (unlimited)
   - User redirected to `/profile?upgrade=success`
6. **User Gets Pro Features**
   - Can now create unlimited piqos
   - Sees "✨ piqo Pro" badge in profile
   - Unlock pro features throughout app

## API Endpoints

### `/api/subscription/upgrade` (POST)

Creates a Stripe checkout session for $15 one-time upgrade.

**Authentication:** Bearer token required in Authorization header

**Request:**
```bash
curl -X POST http://localhost:3000/api/subscription/upgrade \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}
```

## Testing with Stripe Test Cards

### Successful Payment
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- Result: Payment succeeds

### Requires Authentication
- Card: `4000 0025 0000 3155`
- Result: Opens 3D Secure authentication

### Payment Declined
- Card: `4000 0000 0000 0002`
- Result: Card declined

[More Stripe test cards](https://stripe.com/docs/testing)

## Testing Checklist

- [ ] Environment variables are set in `.env.local`
- [ ] Webhook is configured in Stripe Dashboard
- [ ] Database migrations have run successfully
- [ ] Can access `/profile` page with subscription section visible
- [ ] Free users see "Upgrade to Pro - $15" button
- [ ] Pro users see "✨ piqo Pro" with checkmark badge
- [ ] Click upgrade button redirects to Stripe checkout
- [ ] Can complete test payment with test card
- [ ] After payment, redirected to `/profile?upgrade=success`
- [ ] User tier updates to "pro" immediately
- [ ] Can now create 2+ piqos (unlimited)
- [ ] Webhook logs show successful upgrade processing

## File Locations

- **Upgrade API:** `/src/app/api/subscription/upgrade/route.ts`
- **Webhook Handler:** `/src/app/api/webhooks/stripe/route.ts`
- **Profile UI:** `/src/app/profile/page.tsx`
- **Subscription Utilities:** `/src/lib/subscription.ts`
- **Subscription Components:** `/src/components/SubscriptionGate.tsx`

## Monitoring

### Check Webhook Logs
In Stripe Dashboard:
- Go to Developers → Events
- Look for `checkout.session.completed`
- Click event to see full request/response
- Check for any errors

### Database Checks
```sql
-- See user's subscription status
SELECT id, email, subscription_tier, subscription_status, piqo_limit, stripe_customer_id
FROM profiles
WHERE id = 'user_id_here';

-- See recent upgrades (last 24 hours)
SELECT id, subscription_tier, subscription_start_date
FROM profiles
WHERE subscription_start_date > NOW() - INTERVAL '24 hours'
ORDER BY subscription_start_date DESC;
```

## Troubleshooting

### "Missing STRIPE_SECRET_KEY" Error
- Make sure you've added `STRIPE_SECRET_KEY` to `.env.local`
- Restart dev server after adding env vars

### Webhook Not Processing
1. Check webhook is added in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check server logs for webhook errors
4. Look at Stripe Events dashboard for delivery failures

### User Not Upgraded After Payment
1.  Verify webhook was received (check Stripe Events)
2. Check database logs for SQL errors
3. Ensure `profiles` table has all required columns
4. Check subscription update logic in webhook handler

### Stripe Session Creation Fails
- Verify Stripe API keys are correct (test vs live)  
- Check `NEXT_PUBLIC_APP_URL` is set for redirect URLs
- Ensure user is authenticated (valid Bearer token)

## Future Enhancements

- [ ] Enterprise tier ($49/month recurring)
- [ ] Email confirmation after upgrade
- [ ] Invoice generation and email
- [ ] Plan downgrade flow
- [ ] Subscription management portal
- [ ] Promotional codes/discounts
- [ ] Trial period before payment
- [ ] Payment history page

## Support

For issues or questions:
1. Check webhook logs in Stripe Dashboard
2. Review error messages in dev console
3. Check server logs with `npm run dev`
4. Verify all environment variables are set
5. Ensure database migrations have run
