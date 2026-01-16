# Supabase Setup Guide

## What You Need to Do

### 1. **Create the `scanly_sites` Table**

Run the SQL from `supabase/migrations/01_create_sites_table.sql` in your Supabase dashboard:

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy & paste the entire contents of `supabase/migrations/01_create_sites_table.sql`
5. Click **Run**

This creates:
- `scanly_sites` table with columns: `handle`, `user_id`, `config`, `owner_email`, `stripe_account_id`, etc.
- Indexes for fast lookups by `user_id` and `handle`
- Row-Level Security (RLS) policies so users can only see their own sites

### 2. **Ensure `scanly_orders` and `bookings` Tables Exist**

The dashboard also fetches from:
- `scanly_orders` table (for tracking product/digital sales)
- `bookings` table (for booking piqos)

If these don't exist, create them or update `src/app/api/dashboard/route.ts` to use your actual table names.

---

## How the Flow Works

### When a User **Creates & Publishes a Site**:

1. **User signs up** → goes to `/create`
2. **User builds site** with:
   - Handle (e.g., `my-piqo`)
   - Brand name
   - Items, styling, etc.
3. **User clicks "Generate" to publish**:
   - Site config is saved to `scanly_sites` table
   - `user_id` is automatically linked
   - Redirected to `/profile`
4. **On `/profile` page**:
   - Fetches sites from `/api/dashboard` (filtered by `user_id`)
   - Shows "Your Published Piqos" with:
     - View Live button → `/u/{handle}`
     - Download QR button → generates QR code to that URL

### Dashboard (`/dashboard`):
- Also uses `/api/dashboard` to show user's sites, bookings, and orders
- All filtered by `user_id`

---

## Table Schema Summary

### `scanly_sites`
```
- id (BIGSERIAL PRIMARY KEY)
- handle (TEXT UNIQUE) - e.g., "my-piqo"
- user_id (UUID) - owner of the site
- config (JSONB) - full site config (brand name, items, styling, etc.)
- owner_email (TEXT, nullable)
- stripe_account_id (TEXT, nullable)
- published_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

---

## What's Already Implemented

✅ **API Routes:**
- `POST /api/site` - Saves site config to Supabase with user_id
- `GET /api/dashboard` - Fetches user's sites by user_id

✅ **UI:**
- Profile page shows "Your Published Piqos" with View Live & Download QR
- Dashboard shows all sites with full management UI

✅ **Auth Flow:**
- Signup → Create → Publish → Profile → View/Share

---

## Troubleshooting

**Sites not showing on dashboard/profile?**
- Check Supabase SQL Editor → Query `SELECT * FROM scanly_sites;`
- Verify `user_id` matches the logged-in user's ID
- Check RLS policies are not blocking access

**"Table does not exist" error?**
- Run the SQL migration from step 1 above

**QR code not working?**
- Verify the handle is exactly what's in the database
- Check that the site is published (exists in `scanly_sites`)
