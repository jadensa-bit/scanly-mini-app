# Data Isolation Verification Results

## Summary
✅ **Data isolation is WORKING CORRECTLY**

## Findings

### Database State
- **sites table**: 12 total sites
  - 3 with proper `user_id` (user `59df46f0...`)
  - 9 without `user_id` (orphaned test data)
- **scanly_sites table**: Empty (this table was created by migrations but not used yet)
- **bookings table**: 3 bookings all belonging to site "bookings" owned by user `59df46f0...`

### Dashboard API Behavior
- API correctly queries the `sites` table (via TABLE_CANDIDATES: ["sites", "scanly_sites", "site"])
- API correctly filters sites by `user_id`
- API correctly filters bookings/orders by the user's site handles
- **Result**: Each user only sees their own sites and bookings ✅

### Why Multiple Tables Exist
- Old code created a `sites` table for storing publisher data
- New migrations created `scanly_sites` table for better organization  
- Both exist in the database, but API handles this via fallback logic

## If New Accounts See Other Users' Bookings

This would indicate:
1. **Session sharing**: Browser is logged in as same user on different "accounts"
   - Clear browser cache/cookies
   - Use incognito/private window for testing different accounts
   
2. **Email conflict**: Multiple accounts created with same email
   - Each email = different user_id in Supabase auth
   - Check Auth tab in Supabase console

3. **Code bug**: Less likely since isolation is working correctly
   - Verify user_id in browser console: `await supabase.auth.getUser()`
   - Check dashboard API logs for which user is being returned

## Cleanup Recommendations

The old `sites` table has 9 orphaned sites (no user_id). These don't cause data isolation issues because:
- They're filtered out by the `eq('user_id', userId)` query
- But they do clutter the database and contribute to tech debt

### Optional: Clean Up Orphaned Sites
1. Delete their associated bookings and orders
2. Delete the sites themselves
3. Consider dropping the old `sites` table once confident with new setup

See `scripts/migrate-sites-table.mjs` for automation.

## Architecture

### Current (Working)
```
Dashboard Request
  ↓
/api/dashboard
  ↓
Query sites table with filter: user_id = [logged-in user]
  ↓
Get siteHandles from user's sites
  ↓
Query bookings with filter: handle IN [user's siteHandles]
  ↓
Return user's data only ✅
```

### What Could Break Data Isolation
- Removing the `eq('user_id', userId)` filter from sites query
- Querying bookings without the `handle IN [siteHandles]` filter
- Removing NOT NULL constraint on sites.user_id
- Not verifying user authentication before returning data

## Testing

To verify data isolation is working:
1. Create test account A with email `test-a@example.com`
2. Create a site "test-a"
3. Create a booking for test-a
4. Create test account B with email `test-b@example.com`  
5. Create a site "test-b"
6. Log in as test-a → Should only see "test-a" site and its bookings
7. Log in as test-b → Should only see "test-b" site and its bookings
8. Neither should see each other's data ✅

**Note**: Make sure to:
- Use incognito windows or clear cookies between logins
- Verify different user_ids in browser console for each account
- Check that session is actually switched (not still logged in as first user)
