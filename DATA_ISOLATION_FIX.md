# Data Isolation Troubleshooting Guide

## Problem
New accounts are seeing bookings/orders from other test accounts on their dashboard.

## Root Cause Analysis

The data isolation depends on:
1. **Sites must have `user_id`** - Each site is owned by a user
2. **Dashboard filters sites by user_id** - Only shows the logged-in user's sites  
3. **Bookings/orders are filtered by site handles** - Only shows bookings/orders for the user's sites

If a new account sees other accounts' bookings, one of these must be broken:

### Issue A: Old test sites don't have `user_id` (most likely)
If you have test sites created before the user_id system was properly implemented, they might have `NULL` for user_id. These sites would be:
- Excluded from normal user dashboards (since their user_id ≠ logged-in user's id)
- BUT their bookings would still exist in the bookings table

### Issue B: Bookings exist for non-existent or shared sites
If bookings exist with a `handle` that doesn't correspond to any site, or for sites with wrong user_id.

### Issue C: Dashboard filter logic is broken
Though we've verified the API looks correct.

## Diagnostic Steps

### Step 1: Run Verification Script
```bash
npx ts-node scripts/verify-data-isolation.ts
```

This will show:
- How many sites each user has
- Whether any sites have NULL user_id
- Whether bookings/orders belong to sites without user_id
- What data isolation issues exist

### Step 2: Analyze Results

Look for warnings like:
```
⚠️  WARNING: N sites have NO user_id!
⚠️  WARNING: Bookings exist for N sites with NO user_id!
```

If you see these, it means old test data is causing cross-account visibility.

### Step 3: Clean Up Old Data

Option A: Delete old test data (recommended)
```bash
npx ts-node scripts/cleanup-data-isolation.ts
```

This will:
- Find all sites without user_id
- Ask for confirmation
- Delete those sites and all their bookings/orders

Option B: Manual Cleanup
Go to Supabase SQL editor and run:
```sql
-- Find orphaned sites
SELECT handle, user_id FROM scanly_sites WHERE user_id IS NULL;

-- Delete their bookings
DELETE FROM bookings WHERE handle IN (
  SELECT handle FROM scanly_sites WHERE user_id IS NULL
);

-- Delete their orders  
DELETE FROM scanly_orders WHERE handle IN (
  SELECT handle FROM scanly_sites WHERE user_id IS NULL
);

-- Delete the sites
DELETE FROM scanly_sites WHERE user_id IS NULL;
```

## Verification After Fix

After cleanup:
1. Verify script shows no warnings
2. Create a new test account
3. Create a new site
4. Dashboard should only show that account's data
5. Create bookings/orders
6. Switch to different account - should NOT see the other account's bookings/orders

## Prevention

The code is now correct to prevent this in the future:
- `POST /api/site` extracts user_id from auth session
- Sites are created with user_id set
- Dashboard filters by user_id
- All bookings/orders are fetched only for the user's sites

Just make sure existing test data is cleaned up!

## Code References

- **Site Creation** (`POST /api/site`): Line 280 passes `userId` to upsertSite
- **Dashboard API** (`GET /api/dashboard`): Line 85 filters sites by user_id, line 110-125 filters bookings by site handles
- **Site Validation** (migrations): `scanly_sites` table has `user_id NOT NULL`
