# Services Booking Fix - Complete Implementation

## Problem Summary
Services mode bookings were showing "0 team members" and "0 slots" because:
1. Slot generation was dependent on team_members table entries
2. APIs returned empty arrays instead of reason codes
3. UI couldn't distinguish "not configured" from "fully booked"
4. Availability settings weren't being properly saved or used

## Solution Architecture

### Core Principle
**Slots should generate from business hours (availability) alone, regardless of team members.**

Team members are optional filters for multi-staff businesses, not a requirement for booking functionality.

### Changes Made

#### 1. `/src/app/api/slots/route.ts` - Validation & Reason Codes
**Before:** Returned empty array when no slots found
**After:** Validates configuration and returns reason codes

```typescript
// Validates mode === 'services'
if (config.mode !== 'services') {
  return { ok: false, reason: 'NOT_SERVICES_MODE', slots: [] };
}

// Validates availability config exists
if (!config.availability) {
  return { ok: false, reason: 'MISSING_AVAILABILITY', slots: [] };
}

// Validates at least one day is enabled
const hasEnabledDays = Object.values(config.availability.days || {})
  .some((day: any) => day?.enabled);
if (!hasEnabledDays) {
  return { ok: false, reason: 'NO_ENABLED_DAYS', slots: [] };
}
```

**Reason Codes:**
- `MISSING_AVAILABILITY` - No availability config saved
- `NO_ENABLED_DAYS` - Availability exists but no days enabled
- `NOT_SERVICES_MODE` - Piqo is not in Services mode

#### 2. `/src/app/api/team/route.ts` - Config-First Approach
**Before:** Only read from team_members table
**After:** Reads from Piqo config first, falls back to table

```typescript
async function findSiteByHandle(handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select("config, user_id")
      .eq("handle", handle)
      .maybeSingle();
    if (data?.config) return data;
  }
  return null;
}

// Read from config.staffProfiles first
if (siteData?.config?.staffProfiles?.length > 0) {
  const configTeam = siteData.config.staffProfiles.map((staff: any, idx: number) => ({
    id: `config-${idx}`,
    name: staff.name || "Staff",
  }));
  return { ok: true, team: configTeam, source: 'config' };
}

// Fallback to team_members table
const { data: teamData } = await supabase
  .from("team_members")
  .select("*")
  .eq("creator_handle", handle);
return { ok: true, team: teamData || [], source: 'table' };
```

#### 3. `/src/app/api/slots/generate/route.ts` - Already Works Independently
This API already generates slots from availability config alone:
- Reads `availability.days` for business hours
- Uses `slotMinutes`, `bufferMinutes`, `leadTime`
- Generates slots in configured timezone
- **Does NOT require team members**

#### 4. `/src/components/StorefrontPreview.tsx` - UI Improvements

**Added slotsData state:**
```typescript
const [slotsData, setSlotsData] = useState<any>({}); // Full API response with reason
```

**Enhanced error handling:**
```typescript
{(slotsData?.reason === 'MISSING_AVAILABILITY' || slotsData?.reason === 'NO_ENABLED_DAYS') ? (
  <div className="text-xs text-amber-700 p-3 bg-amber-50 border border-amber-200 rounded-lg">
    ⚠️ Bookings aren't configured yet. The creator hasn't set up business hours.
  </div>
) : slots.length === 0 ? (
  <div>No available slots for this date. Try another date or contact directly.</div>
) : (
  // Show time slot picker
)}
```

**Comprehensive logging:**
```typescript
console.log("✅ Slots API response:", {
  count: slotsData.slots?.length || 0,
  reason: slotsData.reason || 'NONE',
  message: slotsData.message || 'N/A',
  ok: slotsData.ok,
});
console.log("✅ Team API response:", {
  count: teamData.team?.length || 0,
  source: teamData.source || 'unknown',
});
```

#### 5. `/src/app/api/site/route.ts` - Already Logs Complete Config
This API already:
- Logs full Services config on save
- Preserves availability settings in JSONB config
- Syncs staffProfiles to team_members table (optional)
- Includes user_id for ownership

## User Flow

### Creator Side (Builder)
1. Creator sets mode to "Services"
2. Creator configures business hours in Availability tab
3. Creator optionally adds staff profiles
4. Creator clicks Publish
5. `/api/site` saves complete config including availability
6. Slots can now be auto-generated from availability

### Customer Side (Booking)
1. Customer opens Piqo booking page
2. `/api/slots` checks if availability configured
   - **If NO:** Returns `MISSING_AVAILABILITY` or `NO_ENABLED_DAYS`
   - **If YES:** Returns available slots or attempts auto-generation
3. UI shows appropriate message:
   - **Not configured:** "⚠️ Bookings aren't configured yet"
   - **Fully booked:** "No available slots for this date"
4. Customer selects date/time and completes booking

## Testing Checklist

### Basic Functionality
- [ ] Create Services Piqo with only business hours (no staff)
- [ ] Verify slots auto-generate on first visit
- [ ] Complete a booking successfully
- [ ] Check booking appears in dashboard

### Edit Mode
- [ ] Open existing Services Piqo in edit mode
- [ ] Verify all availability fields load correctly
- [ ] Change slot length, verify preview updates
- [ ] Change business hours, verify slots regenerate

### Error Cases
- [ ] Piqo with mode='products' → Should show NOT_SERVICES_MODE
- [ ] Services Piqo with no availability → Should show MISSING_AVAILABILITY
- [ ] Services Piqo with availability but no enabled days → Should show NO_ENABLED_DAYS

### Team Members
- [ ] Services Piqo with 0 team → Slots should still generate
- [ ] Services Piqo with 2+ staff → Customer can filter by staff
- [ ] Verify /api/team reads from config.staffProfiles first

## Debug Logging Guide

### Check if availability is saved:
```bash
# In browser console on create page:
# After setting business hours, click Publish and check console
# Should see: "📋 Services config: { mode: 'services', hasAvailability: true, ... }"
```

### Check if slots API validates properly:
```bash
# In browser console on booking page:
# Should see: "✅ Slots API response: { count: X, reason: 'NONE' or specific reason }"
```

### Check if team reads from config:
```bash
# In browser console on booking page:
# Should see: "✅ Team API response: { count: X, source: 'config' or 'table' }"
```

## API Response Formats

### `/api/slots` Success (has slots)
```json
{
  "ok": true,
  "slots": [...],
  "count": 10
}
```

### `/api/slots` - Not Configured
```json
{
  "ok": false,
  "reason": "MISSING_AVAILABILITY",
  "slots": [],
  "message": "Business hours not configured"
}
```

### `/api/slots` - No Enabled Days
```json
{
  "ok": false,
  "reason": "NO_ENABLED_DAYS",
  "slots": [],
  "message": "No days enabled in availability settings"
}
```

### `/api/team` - From Config
```json
{
  "ok": true,
  "team": [
    { "id": "config-0", "name": "John Smith" },
    { "id": "config-1", "name": "Jane Doe" }
  ],
  "source": "config"
}
```

## Next Steps

1. **Test end-to-end flow** with a fresh Services Piqo
2. **Verify persistence** - Edit mode should load all availability settings
3. **Test timezone handling** - Slots should respect configured timezone
4. **Test lead time** - Slots should respect minimum booking time
5. **Test with team filters** - Multi-staff Piqos should allow customer to choose specialist

## Files Modified

1. `/src/app/api/slots/route.ts` - Added validation and reason codes
2. `/src/app/api/team/route.ts` - Config-first approach
3. `/src/components/StorefrontPreview.tsx` - Enhanced UI and logging
4. `/src/app/api/site/route.ts` - Already comprehensive (no changes needed)
5. `/src/app/api/slots/generate/route.ts` - Already independent (no changes needed)

## Key Insights

1. **Single Source of Truth:** Piqo config in sites.config JSONB is the authority for all settings
2. **Graceful Degradation:** APIs return reason codes instead of throwing errors
3. **Config Over Database:** Read from config first, fall back to dedicated tables
4. **Clear User Feedback:** UI distinguishes between "not set up" and "fully booked"
5. **Independent Slot Generation:** Business hours alone are sufficient for booking functionality
