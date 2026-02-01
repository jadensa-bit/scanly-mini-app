# Subscription & Feature Gating System

## Overview
piqo now has a complete freemium subscription system that gates features based on user tier.

## Subscription Tiers

### Free Tier
- **Cost:** $0/forever
- **Features:**
  - 1 piqo storefront
  - Unlimited products/services per piqo
  - QR code generation
  - Basic analytics
  - Stripe integration
  - All core features

### Pro Tier
- **Cost:** $15/month per additional piqo
- **Features:**
  - Unlimited piqos
  - Everything from Free tier
  - Advanced analytics
  - Custom branding
  - Priority support

### Enterprise Tier
- **Cost:** Custom pricing
- **Features:**
  - Everything from Pro tier
  - White-label options
  - Team access
  - Custom domain
  - Dedicated support

## Database Schema

### New Columns in `profiles` Table
```sql
subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing'))
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_start_date TIMESTAMPTZ
subscription_end_date TIMESTAMPTZ
piqo_limit INTEGER DEFAULT 1
```

**Migration file:** `supabase/migrations/12_add_subscription_to_profiles.sql`

## Implementation Files

### Backend

1. **Subscription Utilities** (`src/lib/subscription.ts`)
   - `getUserSubscription(userId)` - Get full subscription info
   - `canAccessFeature(userId, feature)` - Check if user can access a feature
   - `canCreatePiqo(userId)` - Check if user can create another piqo
   - `getPiqoUsage(userId)` - Get piqo usage stats

2. **Subscription API** (`src/app/api/subscription/route.ts`)
   - GET endpoint to fetch user's subscription status
   - Returns tier, limits, features, and usage

### Frontend

1. **Subscription Gate Component** (`src/components/SubscriptionGate.tsx`)
   - `<SubscriptionGate>` - Wraps features and shows upgrade overlay
   - `<FeatureBadge>` - Shows tier badges (Free, Pro, Enterprise)
   - `<PiqoLimitBanner>` - Shows piqo usage with progress bar

2. **Create Page Updates** (`src/app/create/page.tsx`)
   - Fetches subscription status on load
   - Shows subscription banner at top
   - Blocks piqo creation when limit reached
   - Shows upgrade modal with pricing

## How It Works

### 1. User Signs Up
- New users automatically get `subscription_tier = 'free'`
- `piqo_limit = 1` (one free piqo)

### 2. Creating Piqos
When user tries to publish a piqo:

```typescript
// Check subscription
if (!isEditMode && !canCreateMore) {
  setShowUpgradeModal(true);
  return;
}
```

**Free users:**
- Can create 1 piqo
- Hit upgrade modal when trying to create 2nd piqo

**Pro/Enterprise users:**
- Can create unlimited piqos
- No restrictions

### 3. Feature Gating (Optional)
You can wrap premium features with `<SubscriptionGate>`:

```tsx
<SubscriptionGate 
  feature="Advanced Analytics" 
  userTier={subscriptionTier}
  requiredTier="pro"
>
  {/* Premium feature content */}
</SubscriptionGate>
```

### 4. Subscription Status Display
The `<PiqoLimitBanner>` shows:
- Current piqo count vs limit
- Progress bar
- Upgrade button when at limit
- Green "Unlimited" badge for pro/enterprise

## Upgrading Users

### Manual Upgrade (Current)
1. User clicks "Upgrade" button
2. Redirected to `/pricing`
3. **You need to add:** Stripe Checkout flow
4. **You need to add:** Webhook to update `profiles` table

### Recommended Next Steps

#### 1. Create Stripe Checkout Session API
```typescript
// src/app/api/create-checkout-session/route.ts
export async function POST(req: Request) {
  // Create Stripe Checkout Session
  // Update user's stripe_customer_id
  // Return checkout URL
}
```

#### 2. Add Stripe Webhooks
```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(...)
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Update user to pro tier
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          stripe_customer_id: customer_id,
          stripe_subscription_id: subscription_id,
        })
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Handle cancellations, downgrades
      break;
  }
}
```

#### 3. Connect Pricing Page CTAs
Update buttons in `/pricing` page to call the checkout API:

```tsx
<button onClick={() => handleUpgrade('pro')}>
  Upgrade to Pro
</button>

async function handleUpgrade(tier: 'pro' | 'enterprise') {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
```

## Testing

### Set User to Pro Tier (Manual)
```sql
UPDATE profiles 
SET 
  subscription_tier = 'pro',
  piqo_limit = 999,
  subscription_status = 'active'
WHERE id = 'USER_ID';
```

### Check Current Status
```sql
SELECT id, subscription_tier, piqo_limit, stripe_customer_id 
FROM profiles 
WHERE id = 'USER_ID';
```

## Example Usage

### Check if user can create piqo
```typescript
import { canCreatePiqo } from '@/lib/subscription';

const allowed = await canCreatePiqo(userId);
if (!allowed) {
  // Show upgrade modal
}
```

### Display usage stats
```typescript
import { getPiqoUsage } from '@/lib/subscription';

const usage = await getPiqoUsage(userId);
// { used: 1, limit: 1, percentage: 100 }
```

### Feature gate advanced analytics
```tsx
<SubscriptionGate 
  feature="Advanced Analytics"
  userTier="free"
  requiredTier="pro"
>
  <AdvancedAnalyticsDashboard />
</SubscriptionGate>
```

## Revenue Model

### Per-Piqo Pricing
- First piqo: **FREE**
- Each additional piqo: **$15/month**

**Example:**
- User with 1 piqo: $0/mo
- User with 2 piqos: $15/mo
- User with 5 piqos: $60/mo

This is **more flexible** than the current pricing page which shows a flat $15/mo. You may want to update the pricing page to clarify "per piqo" pricing.

## What's Missing (TODO)

- [ ] Stripe Checkout integration
- [ ] Stripe webhook handler
- [ ] Update pricing page CTAs to trigger checkout
- [ ] Email notifications for subscription events
- [ ] Grace period for failed payments
- [ ] Prorate/refund logic for downgrades
- [ ] Admin panel to manage subscriptions
- [ ] Analytics tracking for conversion rates

## Environment Variables Needed

```env
# Already have these
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Add webhook secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Security Notes

1. **Always verify on backend** - Don't trust client-side tier checks
2. **Use RLS policies** - Ensure users can only access their own data
3. **Validate Stripe events** - Always verify webhook signatures
4. **Handle edge cases** - What if payment fails mid-month?

## Support

If users need help:
1. Check their subscription tier in database
2. Verify Stripe subscription status
3. Check for failed payments in Stripe dashboard
4. Manually adjust `piqo_limit` if needed
