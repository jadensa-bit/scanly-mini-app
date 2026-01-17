# Services Booking - Quick Test Plan

## Pre-Test Setup
1. Ensure you're logged in to Piqo
2. Have the browser console open (F12) to see debug logs
3. Clear any existing test data if needed

## Test 1: Create Services Piqo with Business Hours Only (No Staff)

### Steps:
1. Go to `/create`
2. Set mode to "Services"
3. In Setup tab, configure Availability:
   - Enable at least one day (e.g., Monday)
   - Set hours (e.g., 9:00 AM - 5:00 PM)
   - Set slot length (e.g., 30 minutes)
   - Leave staff profiles empty
4. Click Publish

### Expected Console Logs:
```
📋 Services config: { mode: 'services', hasAvailability: true, availability: {...}, staffCount: 0 }
✅ Successfully upserted to sites with user_id: xxx
POST /api/site success for handle: yourhandle
```

### Verify:
- [ ] No errors in console
- [ ] Redirect to booking page
- [ ] Should see your Services Piqo

## Test 2: Verify Slots Auto-Generate

### Steps:
1. On the booking page from Test 1, open an item to book
2. Watch console logs

### Expected Console Logs:
```
✅ Slots API response: { count: 0, reason: 'NONE', ok: true }
🚀 No slots found, attempting auto-generation...
✅ Slots auto-generated successfully: { count: X, firstSlot: ..., lastSlot: ... }
✅ Slots API response: { count: X, reason: 'NONE', ok: true }
```

### Verify:
- [ ] Slots appear in time picker
- [ ] Can select a date and time
- [ ] Time slots match configured business hours

## Test 3: Complete a Booking

### Steps:
1. Select a date and time slot
2. Enter customer name and email
3. Click "Book Now"

### Expected:
- [ ] Booking creates successfully
- [ ] Confirmation screen shows booking ID and QR code
- [ ] Dashboard shows the new booking

## Test 4: Verify Team API Reads from Config

### Steps:
1. Go back to `/create?edit=true` for your test Piqo
2. Add 2 staff profiles in Setup tab
3. Click Publish
4. Go to booking page
5. Open console and check logs

### Expected Console Logs:
```
✅ Team API response: { count: 2, source: 'config' }
```

### Verify:
- [ ] Team selector shows 2 staff members
- [ ] Can filter slots by team member

## Test 5: Edit Mode Hydration

### Steps:
1. Go to `/dashboard`
2. Click "Edit" on your test Piqo
3. Check Setup tab

### Expected:
- [ ] All availability fields populated correctly
- [ ] Business hours match what you saved
- [ ] Staff profiles show correctly
- [ ] Preview shows current state

## Test 6: Error Case - No Availability

### Steps:
1. Create a new Services Piqo
2. Set mode to "Services"
3. DO NOT configure business hours
4. Click Publish
5. Try to book

### Expected Console Logs:
```
✅ Slots API response: { count: 0, reason: 'MISSING_AVAILABILITY', ok: false }
```

### Expected UI:
- [ ] Shows amber warning: "⚠️ Bookings aren't configured yet. The creator hasn't set up business hours."
- [ ] Does NOT attempt auto-generation

## Test 7: Error Case - No Enabled Days

### Steps:
1. Create a new Services Piqo
2. Set mode to "Services"
3. Configure availability but disable all days
4. Click Publish
5. Try to book

### Expected Console Logs:
```
✅ Slots API response: { count: 0, reason: 'NO_ENABLED_DAYS', ok: false }
```

### Expected UI:
- [ ] Shows amber warning: "⚠️ Bookings aren't configured yet. The creator hasn't set up business hours."

## Test 8: Slot Length Changes Update Preview

### Steps:
1. Edit an existing Services Piqo
2. Change slot length from 30 to 60 minutes
3. Watch live preview

### Expected:
- [ ] Preview re-fetches slots automatically
- [ ] Time slots reflect new duration

## Test 9: Lead Time Enforcement

### Steps:
1. Edit Services Piqo
2. Set leadTime to 2 hours
3. Try to book a slot within the next 2 hours

### Expected:
- [ ] Slots within 2 hours should not appear
- [ ] First available slot should be 2+ hours from now

## Test 10: Multiple Customers Can Book Different Slots

### Steps:
1. Open booking page in 2 different browsers/incognito windows
2. Both customers select different time slots on same day
3. Both complete bookings

### Expected:
- [ ] Both bookings succeed
- [ ] Both show in dashboard
- [ ] Slots update correctly for subsequent bookings

## Performance Checks

### During all tests, monitor:
- [ ] No infinite loops (check for repeated fetch calls)
- [ ] No memory leaks (Realtime subscriptions clean up properly)
- [ ] API responses are fast (< 1 second)
- [ ] Console logs are clear and helpful

## Common Issues to Watch For

1. **"0 team members" but slots still don't generate**
   - Check: Did availability get saved? Look for "hasAvailability: true" in logs
   - Check: Are any days enabled? Look for "enabledDays: []" should have values

2. **Slots generate but wrong timezone**
   - Check: availability.timezone in config
   - Check: Generated slot times match business hours in that timezone

3. **Edit mode doesn't load availability**
   - Check: hasHydratedRef preventing re-hydration
   - Check: GET /api/site returns full config including availability

4. **Preview doesn't update when changing slot length**
   - Check: useEffect on availability is triggering
   - Check: fetchData() is being called

## Success Criteria

✅ **Test passes if:**
- Services Piqo works with 0 team members
- Slots auto-generate from business hours
- Customers can complete bookings
- Edit mode loads all saved settings
- Preview updates in real-time
- Clear error messages when not configured
- All console logs are informative, no errors
