# New piqo Features - SMS & Growth Tools

## 🎉 What's New

### 1. SMS Receipts & Notifications 📱

**Auto-send receipts after payment:**
- Customers get instant SMS receipt with order details
- Booking confirmations sent via text
- Phone number collected at checkout

**Setup:**
1. Get Twilio credentials at https://console.twilio.com/
2. Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
3. SMS automatically sent on successful payment (via webhook)

**Files created:**
- `src/lib/sms.ts` - SMS utility functions
- `src/app/api/sms/receipt/route.ts` - Manual receipt endpoint
- `src/app/api/sms/booking-confirmation/route.ts` - Booking SMS

**Integrated into:**
- `/api/webhooks/stripe` - Auto-sends SMS after payment

---

### 2. Tip Jar Feature 💰

**Standalone tip page for each piqo:**
- Visit `/u/{handle}/tips` to leave a tip
- Preset amounts ($5, $10, $20, $50) or custom
- Optional message from tipper
- 5% platform fee

**Database:**
- New `tips` table (migration: `13_add_tips_table.sql`)
- Tracks tip amount, status, tipper info

**Files created:**
- `src/app/u/[handle]/tips/page.tsx` - Tip jar page
- `src/app/u/[handle]/tip-success/page.tsx` - Thank you page
- `src/app/api/tips/checkout/route.ts` - Stripe checkout for tips

**Integrated into:**
- `/api/webhooks/stripe` - Marks tips as paid

---

### 3. Instagram Story Templates 📸

**Generate shareable story graphics with QR code:**
- 3 templates: Gradient, Minimal, Dark Mode
- Instagram Story dimensions (1080x1920)
- Downloadable SVG with embedded QR code

**Usage:**
```tsx
import StoryTemplateGenerator from '@/components/StoryTemplateGenerator';

<StoryTemplateGenerator handle="myhandle" brandName="My Brand" />
```

**Files created:**
- `src/app/api/story-template/route.ts` - Template generator API
- `src/components/StoryTemplateGenerator.tsx` - React component

**Dependencies:**
- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types

---

## 🚀 How to Use

### SMS Receipts
1. Configure Twilio credentials
2. Collect customer phone at checkout (optional field)
3. SMS automatically sent after successful payment

### Tip Jar
1. Run migration: `supabase migration up`
2. Share tip link: `yourdomain.com/u/yourhandle/tips`
3. Customers can tip any amount
4. View tips in dashboard (coming soon)

### Instagram Stories
1. Add `<StoryTemplateGenerator>` to your dashboard
2. Select template style
3. Generate and download story image
4. Upload to Instagram and share!

---

## 📊 Impact

**SMS Receipts:**
- ✅ Reduces "where's my receipt?" support requests
- ✅ Builds customer trust (instant confirmation)
- ✅ Enables SMS follow-ups for repeat business

**Tip Jar:**
- ✅ New revenue stream for service businesses
- ✅ Easy for customers (QR scan → tip → done)
- ✅ Perfect for barbers, nail techs, etc.

**Instagram Stories:**
- ✅ Shareable marketing content
- ✅ Drives traffic to piqo
- ✅ Professional-looking branded graphics

---

## 🔜 Coming Soon

- SMS follow-up campaigns (24hrs after purchase)
- Appointment reminders (24hrs before booking)
- SMS settings in dashboard (toggle on/off)
- Tip analytics in dashboard
- More Instagram template styles
- Video story templates

---

## 💡 Next Features to Build

1. **Referral Program** - Customers share QR, get $5 credit
2. **Customer CRM** - Auto-save customer info, purchase history
3. **Analytics Dashboard** - Best-selling items, peak hours
4. **Limited-Time Offers** - Flash sales with countdown
5. **Group Buy / Split Payment** - Friends can split orders

---

**Questions?** Check the code comments or ask in chat! 🎉
