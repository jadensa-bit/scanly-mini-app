# Live Bookings Setup Guide

## Overview
To make live bookings work on Scanly, you need to:
1. ✅ Create the necessary database tables in Supabase
2. Enable realtime subscriptions
3. Create booking flow on your storefront
4. Wire up the booking creation endpoints

## Step 1: Create Database Tables

Run the migration to create all required tables:

```bash
# Option A: Use Supabase CLI
supabase migration up

# Option B: Manually in Supabase SQL Editor
# Copy and paste the contents of: supabase/migrations/02_create_booking_tables.sql
```

This creates:
- **slots** - Available time slots for booking
- **bookings** - Customer bookings (connected to slots)
- **scanly_orders** - Product/digital purchases
- **RLS Policies** - Allow public bookings while protecting creator data
- **Realtime** - Enables live updates on dashboard

## Step 2: Verify Tables in Supabase

1. Go to **Supabase Console** → **SQL Editor**
2. Run this query to verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('slots', 'bookings', 'scanly_orders');
```

You should see 3 rows returned.

## Step 3: Enable Realtime (if not auto-enabled)

1. Go to **Supabase Console** → **Realtime**
2. Under "Realtime Enabled", ensure these are enabled:
   - ✅ bookings
   - ✅ slots
   - ✅ scanly_orders

(The migration file should auto-enable these via the `ALTER PUBLICATION` commands)

## Step 4: Test the Booking Flow

### Create a Booking Page
1. Go to [http://localhost:3000/create](http://localhost:3000/create)
2. Set **Mode** to "services" (or "booking")
3. Add your availability (hours, timezone, slot length)
4. Save and publish

### View Your Live Store
1. Click the **QR** button to view your published storefront
2. Tap on a service to book
3. Complete the booking flow

### See Live Updates

1. Go to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. You should see bookings appear in the "Recent Bookings" section in real-time

## Step 5: Wire Up Booking Creation on Storefront

The booking flow isn't yet fully integrated into `StorefrontPreview.tsx`. Here's what needs to happen:

### Current State:
- StorefrontPreview shows services but doesn't have booking UI state
- No time slot picker
- No booking creation API call

### What's Missing:
1. **Add state** for booking confirmation modal
2. **Show time slots** from `/api/slots?handle=[handle]`
3. **Create booking** via POST to `/api/bookings/create`
4. **Show confirmation** after booking

### To Enable Bookings:

Update `src/components/StorefrontPreview.tsx` to add:

```tsx
// Add state for booking flow
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [bookingStep, setBookingStep] = useState<"browse" | "confirm" | "success">("browse");
const [selectedSlot, setSelectedSlot] = useState<any>(null);
const [slots, setSlots] = useState<any[]>([]);
const [bookingLoading, setBookingLoading] = useState(false);

// Fetch available slots when service is selected
const fetchSlots = async (handle: string) => {
  const res = await fetch(`/api/slots?handle=${handle}`);
  const data = await res.json();
  setSlots(data.slots || []);
};

// Create booking
const createBooking = async (slotId: string, customerName: string, customerEmail: string) => {
  setBookingLoading(true);
  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: slotId, customer_name: customerName, customer_email: customerEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setBookingStep("success");
    } else {
      alert(data.error || "Booking failed");
    }
  } finally {
    setBookingLoading(false);
  }
};
```

## Step 6: Dashboard Realtime

The dashboard already has realtime subscribed set up. Once bookings are created, they'll appear live because:

1. `src/app/dashboard/realtime.ts` subscribes to the `bookings` table
2. When a new booking is inserted, the dashboard updates in real-time
3. No page refresh needed!

## Troubleshooting

### "No bookings yet"
- Check that the `bookings` table exists: `SELECT COUNT(*) FROM bookings;`
- Ensure realtime is enabled for the `bookings` table
- Create a test booking on your storefront

### Bookings not appearing on dashboard
- Check browser console for errors
- Verify auth token is being sent to dashboard API
- Check Supabase logs for any errors

### Realtime not working
- Go to Supabase Console → **Realtime** → Verify tables are enabled
- Check browser Network tab → `realtime` websocket is open
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in `.env.local`

## Next Steps

1. **Complete Storefront Booking UI** - Add time slot picker & confirmation to StorefrontPreview
2. **Add Stripe Integration** - Collect deposit payment before confirming booking
3. **Add SMS/Email Confirmations** - Notify customers of booking status via notifications
4. **Add Check-in** - Implement QR check-in system for appointments
5. **Export Calendar** - Provide ICS/calendar export for confirmations

---

## API Reference

### POST /api/bookings/create
Create a new booking

```json
{
  "slot_id": "12345",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

### GET /api/slots?handle=myshop
Get available slots for a creator

```json
{
  "slots": [
    {
      "id": "1",
      "start_time": "2024-01-20T09:00:00Z",
      "end_time": "2024-01-20T09:30:00Z",
      "is_booked": false
    }
  ]
}
```

### GET /api/dashboard
Get dashboard data including bookings

```json
{
  "bookings": [...],
  "sites": [...],
  "orders": [...]
}
```
