# Slot Generation Debug Guide

## Enhanced Debug Logging Added

The slot generation system now includes comprehensive debug logging to identify data structure mismatches and time calculation issues.

## What Was Added

### 1. `/api/site` - Save Time Logging
When you publish or edit a Services Piqo, you'll now see:

```
📋 Services config: { mode: 'services', hasAvailability: true, ... }
🔍 SAVING AVAILABILITY - Full structure: {
  "timezone": "America/New_York",
  "slotMinutes": 30,
  "bufferMinutes": 0,
  "advanceDays": 7,
  "leadTime": 0,
  "days": {
    "mon": { "enabled": true, "start": "09:00", "end": "17:00" },
    "tue": { "enabled": true, "start": "09:00", "end": "17:00" },
    ...
  }
}
🔍 AVAILABILITY.DAYS: { detailed structure }
```

**Action:** After setting business hours and clicking Publish, check the console for these logs to verify the exact structure being saved.

### 2. `/api/slots/generate` - Generation Time Logging
When slots are auto-generated, you'll see detailed per-day logs:

```
🔍 FULL AVAILABILITY CONFIG: { complete JSON }
🔍 DAYS STRUCTURE: { days object }
✅ Generating slots with config: {
  slotMinutes: 30,
  bufferMinutes: 0,
  leadTime: 0,
  timezone: "America/New_York",
  enabledDays: ["mon", "tue", "wed"],
  daysKeys: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
}

📅 Processing date 2026-01-20 (mon): {
  dayName: "mon",
  dayOfWeek: 1,
  hasDayConfig: true,
  enabled: true,
  start: "09:00",
  end: "17:00"
}
  ⏰ Time range: 09:00 (9:0) to 17:00 (17:0)
  📏 Day window: 2026-01-20T09:00:00.000Z to 2026-01-20T17:00:00.000Z
  ⏱️  Slot duration: 30 min, Buffer: 0 min
  🕐 Min booking time (leadTime): 2026-01-17T17:30:00.000Z
  ✅ Generated 16 slots for this day (skipped 0 due to leadTime)

📅 Processing date 2026-01-21 (tue): ...
```

**Action:** When booking page auto-generates slots, watch console for these detailed logs.

## Testing Workflow

### Step 1: Create/Edit a Services Piqo
1. Go to `/create` or `/dashboard` → Edit existing Piqo
2. Set mode to "Services"
3. Configure business hours (enable at least one day)
4. Open browser console (F12)
5. Click Publish
6. **Look for:**
   - `🔍 SAVING AVAILABILITY` logs showing exact structure
   - Verify `days` object has correct format
   - Check that enabled days have `start` and `end` times

### Step 2: Test Slot Generation
1. Navigate to booking page (e.g., `/u/yourhandle`)
2. Open an item to book
3. Open browser console
4. **Look for:**
   - `🔍 FULL AVAILABILITY CONFIG` showing what was loaded
   - `📅 Processing date` logs for each day
   - `✅ Generated X slots for this day` messages
   - If 0 slots generated, check which step failed

### Step 3: Identify Issues

#### Issue: No slots generated despite availability
**Check:**
- Are `enabledDays` showing in the logs?
- Does each enabled day have valid `start` and `end` times?
- Is `slotMinutes` reasonable (should be ≤ day window)?
- Is `leadTime` preventing all slots? (e.g., 24 hour notice but only generating 1 day ahead)

#### Issue: Days structure doesn't match
**Symptoms:**
```
📅 Processing date 2026-01-20 (mon): {
  hasDayConfig: false,  ← PROBLEM
  enabled: undefined,
  start: undefined
}
```

**Check:**
- `🔍 DAYS STRUCTURE` log - verify keys are "mon", "tue", etc.
- Verify each day object has: `{ enabled: true, start: "HH:MM", end: "HH:MM" }`

#### Issue: Time parsing fails
**Symptoms:**
```
⏰ Time range: 09:00 (NaN:NaN) to 17:00 (NaN:NaN)
```

**Check:**
- Start/end times are in "HH:MM" format
- Hours are 0-23, minutes are 0-59
- Times don't have extra characters or spaces

#### Issue: Slots generated but filtered out
**Symptoms:**
```
✅ Generated 0 slots for this day (skipped 16 due to leadTime)
```

**Check:**
- `leadTime` setting - if 24 hours, only future dates will have slots
- `minBookingTime` log - slots before this time are excluded
- Consider reducing `leadTime` or generating further into the future

## Common Data Structure Issues

### ✅ Correct Format (Expected)
```json
{
  "timezone": "America/New_York",
  "slotMinutes": 30,
  "bufferMinutes": 0,
  "advanceDays": 7,
  "leadTime": 0,
  "days": {
    "mon": { "enabled": true, "start": "09:00", "end": "17:00" },
    "tue": { "enabled": true, "start": "09:00", "end": "17:00" },
    "wed": { "enabled": false, "start": "09:00", "end": "17:00" },
    "thu": { "enabled": true, "start": "10:00", "end": "16:00" },
    "fri": { "enabled": true, "start": "09:00", "end": "17:00" },
    "sat": { "enabled": false, "start": "09:00", "end": "17:00" },
    "sun": { "enabled": false, "start": "09:00", "end": "17:00" }
  }
}
```

### ❌ Wrong Format - Missing Days
```json
{
  "timezone": "America/New_York",
  "slotMinutes": 30,
  "days": {}  ← PROBLEM: Empty days object
}
```

### ❌ Wrong Format - Wrong Keys
```json
{
  "days": {
    "monday": { ... },  ← PROBLEM: Should be "mon"
    "tuesday": { ... }  ← PROBLEM: Should be "tue"
  }
}
```

### ❌ Wrong Format - Missing enabled Flag
```json
{
  "days": {
    "mon": { "start": "09:00", "end": "17:00" }  ← PROBLEM: Missing "enabled"
  }
}
```

## Time Calculation Debug

### Slot Window Calculation
```
Day: Monday, Jan 20, 2026
Business hours: 09:00 - 17:00
Slot duration: 30 min
Buffer: 0 min

Expected slots:
09:00-09:30, 09:30-10:00, 10:00-10:30, ...
16:30-17:00 (last slot)
Total: 16 slots
```

**Watch for:**
- Day window includes the full range
- Slots don't extend past `dayEnd`
- Buffer time is added correctly between slots

### Lead Time Filtering
```
Current time: Jan 17, 5:30 PM
Lead time: 2 hours
Min booking time: Jan 17, 7:30 PM

Slots on Jan 17 before 7:30 PM → Skipped
Slots on Jan 17 after 7:30 PM → Included
Slots on Jan 18+ → All included
```

**Watch for:**
- `leadTime` in hours converts correctly
- `minBookingTime` calculation is accurate
- Slots are compared to min time before adding

## Quick Fix Checklist

If slots are still not generating after checking logs:

1. **Verify data is saved:**
   - [ ] Check `🔍 SAVING AVAILABILITY` shows correct structure
   - [ ] Refresh page and re-edit to confirm data persisted

2. **Verify data is loaded:**
   - [ ] Check `🔍 FULL AVAILABILITY CONFIG` matches saved data
   - [ ] Verify `days` object has all 7 days with correct keys

3. **Verify day configuration:**
   - [ ] At least one day has `enabled: true`
   - [ ] Enabled days have valid `start` and `end` times
   - [ ] Times are in "HH:MM" format (e.g., "09:00", not "9:00 AM")

4. **Verify slot parameters:**
   - [ ] `slotMinutes` fits within business hours (e.g., 30 min slot in 8 hour day = OK)
   - [ ] `bufferMinutes` doesn't consume all available time
   - [ ] `leadTime` doesn't exclude all generated slots

5. **Verify time math:**
   - [ ] `📏 Day window` shows correct date and times
   - [ ] `✅ Generated X slots` shows count > 0
   - [ ] `skipped X due to leadTime` isn't skipping everything

## Expected Output (Success)

When everything works correctly, you should see:

```
🔍 SAVING AVAILABILITY - Full structure: { valid JSON }
✅ Successfully upserted to sites with user_id: xxx

... later on booking page ...

🔍 FULL AVAILABILITY CONFIG: { matches saved data }
✅ Generating slots with config: { enabledDays: ["mon", "tue", "wed", "thu", "fri"] }

📅 Processing date 2026-01-20 (mon): { enabled: true, start: "09:00", end: "17:00" }
  ✅ Generated 16 slots for this day
📅 Processing date 2026-01-21 (tue): { enabled: true, start: "09:00", end: "17:00" }
  ✅ Generated 16 slots for this day
...

✅ Generated 112 slots for yourhandle
✅ Successfully inserted 112 slots for yourhandle
📅 Slot time range: 2026-01-20T09:00:00.000Z to 2026-01-26T17:00:00.000Z
```

## Next Steps

1. **Test now:** Create or edit a Services Piqo and watch the logs
2. **Share findings:** Copy the console logs showing the data structure
3. **Fix mismatches:** If structure is wrong, we'll update the builder or generator to align
4. **Verify end-to-end:** Once slots generate, complete a booking to confirm full flow

---

**Remember:** The goal is to identify the exact format of the saved `availability.days` object and ensure the slot generator reads it correctly. The enhanced logging will show us exactly where the mismatch occurs.
