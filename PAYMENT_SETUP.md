# Payment Integration Setup

This guide explains how to complete the payment infrastructure for booking deposits using Stripe.

## Current Status

✅ **Completed:**
- Payment settings type definition (`PaymentSettings`)
- Payment state management in create page (`payments` state)
- Payment configuration persistence (draft save, config merge)
- UI controls for enabling/configuring deposits in create page
- Payment prop passed through StorefrontPreview component
- Booking flow checks for payment requirement and redirects to checkout
- Placeholder checkout route created (`/api/bookings/checkout`)
- Stripe webhook handler exists (`/api/webhooks/stripe`)

⏳ **TODO - Implementation Steps:**

### 1. Set Up Stripe Account
- Create Stripe account at https://stripe.com
- Get your publishable key and secret key
- Add to `.env.local`:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

### 2. Complete Checkout Route (`/api/bookings/checkout/route.ts`)

The checkout route needs to:
1. Extract booking details from query parameters
2. Fetch site config to get payment settings and Stripe account
3. Calculate amount:
   - If depositRequired: `item_price * depositPercentage / 100`
   - Otherwise: full item_price
4. Create Stripe checkout session with booking metadata
5. Return checkout URL

**Key code needed:**
```typescript
// Calculate amount in cents
const amount = payments.depositRequired
  ? Math.round(price * (payments.depositPercentage / 100) * 100)
  : Math.round(price * 100);

// Create checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  success_url: `${origin}/u/${handle}?payment=success`,
  cancel_url: `${origin}/u/${handle}?payment=cancelled`,
  line_items: [{
    price_data: {
      currency: payments.currencyCode,
      product_data: {
        name: item_title,
        description: payments.depositRequired ? "Deposit" : "Full payment",
      },
      unit_amount: amount,
    },
    quantity: 1,
  }],
  metadata: {
    handle,
    slot_id,
    team_member_id: team_member_id || "",
    customer_name,
    customer_email,
    item_title,
    is_deposit: String(payments.depositRequired),
  },
});
```

### 3. Complete Webhook Handler (`/api/webhooks/stripe/route.ts`)

When payment is complete, Stripe sends a webhook. The handler should:
1. Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
2. Check for `checkout.session.completed` event
3. Extract booking metadata from session
4. Create booking in database
5. Send confirmation email with QR code

**Key webhook logic:**
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET!
);

if (event.type === "checkout.session.completed") {
  const session = event.data.object;
  const metadata = session.metadata;
  
  // Create booking with all metadata
  // Send confirmation email
}
```

### 4. Update StorefrontPreview Confirmation Message

When payment is required, show user that they'll be redirected to Stripe checkout:
```typescript
{payments?.enabled && (
  <div className="text-xs text-white/70 rounded-lg bg-white/5 p-3 border border-white/10">
    {payments.depositRequired 
      ? `${payments.depositPercentage}% deposit required to confirm booking`
      : "Payment required to confirm booking"
    } via secure Stripe checkout.
  </div>
)}
```

### 5. Add Stripe Webhook to Stripe Dashboard

1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Enter: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `charge.refunded`
5. Copy signing secret to `.env.local`

### 6. Testing Flow

**Without Stripe Connected (Current):**
- Create page shows payment UI ✅
- Customer sees "Payment required" message ✅
- Redirects to checkout route (returns 501 error)
- Can test by using test Stripe keys

**With Stripe Connected:**
1. Enable payment in create page
2. Set deposit % or full payment
3. Click "Book now" on storefront
4. Should redirect to Stripe checkout
5. Use test card: 4242 4242 4242 4242 (any future date, any CVC)
6. After payment, webhook creates booking automatically

### 7. Environment Variables Needed

```bash
# Stripe (required for checkout + webhook)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (for payment confirmation emails)
RESEND_API_KEY=re_...
```

## Architecture Notes

- **Payment Flow**: Booking create → checkout redirect → Stripe payment → webhook → booking created
- **Deposit Logic**: Calculate percentage of item price, request that amount from Stripe
- **Metadata**: Pass all booking details through Stripe session metadata so webhook can recreate booking
- **Email**: Send confirmation email from webhook after successful payment with QR code
- **Fallback**: If webhook fails, manually retry from Stripe dashboard webhook attempts

## Files to Update

1. `/api/bookings/checkout/route.ts` - Implement Stripe session creation
2. `/api/webhooks/stripe/route.ts` - Add booking creation logic to existing webhook
3. `/components/StorefrontPreview.tsx` - Show payment info message (optional)

## Testing with Stripe Test Mode

Use test card: `4242 4242 4242 4242`
- Date: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)

This will complete the payment flow without charging real money.