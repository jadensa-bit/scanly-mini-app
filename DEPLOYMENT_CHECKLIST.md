# Deployment Checklist for piqo

## ✅ Fixes Applied

### 1. Email Authentication Fixed
- Changed `email_confirm: false` to `email_confirm: true` in signup route
- New users will now receive email confirmation
- **Action needed**: Configure SMTP in Supabase Dashboard

### 2. Stripe Connect Enhanced
- Added better error logging and SDK initialization
- Verified Stripe keys are working correctly

---

## 🚀 Vercel Deployment Setup

### Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://djghvdbpbjzyxahusnri.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_URL=https://djghvdbpbjzyxahusnri.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

---

## 📧 Supabase Email Configuration

### Enable Email Authentication

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri)
2. Navigate to **Authentication** → **Email Templates**
3. Configure SMTP settings:
   - **SMTP Provider**: Choose from SendGrid, AWS SES, or custom SMTP
   - **From Email**: Set your sender email (e.g., `noreply@piqo.app`)
   - **From Name**: `piqo`

### Recommended SMTP Providers:
- **Resend** (easiest): Free tier, 3000 emails/month
- **SendGrid**: Free tier, 100 emails/day
- **AWS SES**: $0.10 per 1000 emails

### Quick Resend Setup:
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. In Supabase → Auth → Settings:
   - Enable Custom SMTP
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: `<your-resend-api-key>`

---

## 💳 Stripe Webhook Configuration

### Setup Production Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://piqo-bulder.vercel.app/api/webhooks/stripe
   ```
4. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `payment_intent.succeeded` (optional)
   - `account.updated` (optional for Connect)
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Test Webhook
```bash
# Install Stripe CLI
stripe listen --forward-to https://piqo-bulder.vercel.app/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 🔍 Troubleshooting

### Stripe Connect Not Working

**Symptoms:**
- "Could not start Stripe Connect" error
- No onboarding URL generated

**Solutions:**
1. Check Vercel logs:
   ```bash
   vercel logs
   ```
2. Verify environment variables are set in Vercel (not just .env.local)
3. Ensure Stripe keys start with `sk_live_` for production
4. Check [stripe-connect] logs in Vercel Function logs

**Test locally:**
```bash
npm run dev
# Open http://localhost:3000/create
# Try "Connect Stripe" button
# Check terminal for [stripe-connect] logs
```

### Email Not Sending

**Check:**
1. Supabase Dashboard → Authentication → Settings → SMTP configured
2. Test email:
   ```bash
   # In Supabase SQL Editor
   SELECT auth.admin.create_user({
     email: 'test@example.com',
     password: 'testpass123',
     email_confirm: true
   });
   ```
3. Check Supabase logs for email delivery status

### Database Issues

**Reset data isolation (if needed):**
```bash
npm run check:db
node check-ownership.mjs
```

---

## 📝 Post-Deployment Verification

### 1. Test Signup Flow
- [ ] Go to `/signup`
- [ ] Create new account
- [ ] Check email inbox for confirmation
- [ ] Verify can log in after confirming

### 2. Test Stripe Connect
- [ ] Go to `/create`
- [ ] Enter handle and details
- [ ] Click "Connect Stripe"
- [ ] Complete Stripe onboarding
- [ ] Verify returns to app successfully

### 3. Test Checkout
- [ ] Create a test storefront
- [ ] Publish it
- [ ] Visit public URL (`/u/yourhandle`)
- [ ] Try to checkout
- [ ] Complete payment
- [ ] Verify order recorded in database

### 4. Test Dashboard
- [ ] Go to `/dashboard`
- [ ] Verify bookings appear in real-time
- [ ] Check-in a booking
- [ ] Verify status updates

---

## 🔐 Security Notes

- ⚠️ **Never commit `.env.local`** to git
- ✅ Use Vercel environment variables for production
- ✅ Rotate Stripe webhook secrets if exposed
- ✅ Enable Stripe webhook signature verification (already implemented)
- ✅ Use SUPABASE_SERVICE_ROLE_KEY only in API routes, never client-side

---

## 📚 Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🎯 Quick Deploy Command

```bash
# Push to main branch
git add .
git commit -m "feat: fix email auth and stripe connect"
git push origin main

# Vercel will auto-deploy
# Or manually: vercel --prod
```

Remember to set all environment variables in Vercel dashboard before deployment!
