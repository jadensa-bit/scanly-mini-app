# 🎯 Quick Setup Guide for piqo

## Current Status
✅ Platform tested and working!  
⚠️  Two items need attention for full functionality

---

## 🔧 Fix #1: Stripe in Development (5 minutes)

### Problem
You're using **live Stripe keys** which require HTTPS. Local development uses HTTP.

### Solution: Get Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Toggle to **Test Mode** (switch in sidebar)
3. Copy these keys:
   - **Secret key**: `sk_test_...`
   - **Publishable key**: `pk_test_...`

4. Update `.env.local`:
```bash
# Replace these two lines:
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE
```

5. Restart dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

6. Test Stripe Connect:
   - Go to http://localhost:3000/create
   - Click "Connect Stripe"
   - Should open Stripe onboarding ✅

---

## 📧 Fix #2: Email Confirmation (10 minutes)

### Problem
Code is ready to send emails but Supabase SMTP not configured.

### Solution: Configure Resend (Recommended)

#### Step 1: Get Resend API Key
1. Sign up at [resend.com](https://resend.com) (free)
2. Verify your domain OR use `onboarding@resend.dev` for testing
3. Create API key
4. Copy the key (starts with `re_...`)

#### Step 2: Configure Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri)
2. Click **Authentication** → **Email Templates**
3. Scroll to **SMTP Settings**
4. Click **Enable Custom SMTP**
5. Fill in:
   ```
   Sender name: piqo
   Sender email: noreply@yourdomain.com (or onboarding@resend.dev)
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: <paste-your-resend-api-key>
   ```
6. Click **Save**

#### Step 3: Test Email
```bash
# In your app, try signup
# Check email inbox for confirmation
```

---

## ✅ Verification Checklist

After fixes above:

- [ ] Stripe Connect works (opens onboarding page)
- [ ] Signup sends confirmation email
- [ ] Can login after confirming email
- [ ] Can create storefront
- [ ] Can publish storefront
- [ ] Public page loads (`/u/yourhandle`)
- [ ] Checkout flow works

---

## 🚀 Deploy to Production (Optional)

### Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Platform ready for production"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add environment variables (from `.env.local`)
   - Deploy!

3. **After Deployment:**
   - Update Stripe webhook URL to production
   - Switch back to **LIVE** Stripe keys in Vercel
   - Update Supabase allowed URLs

---

## 📊 Test Results

Full platform test completed ✅

| Feature | Status |
|---------|--------|
| Server | ✅ Working |
| Authentication | ✅ Working |
| Database | ✅ Working |
| Storefront Creation | ✅ Working |
| Public Pages | ✅ Working |
| Dashboard | ✅ Working |
| Stripe (with fix) | ⚠️  Needs test keys |
| Emails (with fix) | ⚠️  Needs SMTP |

See [TEST_REPORT.md](TEST_REPORT.md) for detailed results.

---

## 🆘 Troubleshooting

### Stripe Connect Still Fails
- Make sure you're using `sk_test_...` (not `sk_live_...`)
- Restart dev server after changing `.env.local`
- Check terminal logs for errors

### Emails Not Sending
- Verify Resend API key is correct
- Check Supabase → Logs → Auth for errors
- Try using `onboarding@resend.dev` as sender for testing

### Database Errors
- Check Supabase RLS policies
- Verify user is authenticated
- Check browser console for errors

---

## 📞 Need Help?

- **Stripe Docs:** https://stripe.com/docs/connect
- **Resend Docs:** https://resend.com/docs
- **Supabase Docs:** https://supabase.com/docs/guides/auth

---

**Platform Status:** ✅ 85% Complete - Ready with 2 quick fixes!
