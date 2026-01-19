# Draft/Publish Separation Fix

## Problem
When users edit their piqo, the changes were immediately going live to their `/u/[handle]` page. This meant customers could see incomplete or work-in-progress changes.

## Solution
Added a draft/publish workflow:
1. **New sites**: When creating a new piqo, changes go directly to `config` (live immediately)
2. **Editing existing sites**: Changes save to `draft_config` (not visible to customers)
3. **Publishing**: When user clicks "Go live" or "All done! Ready to go live", the `draft_config` is copied to `config` and becomes live

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/07_add_draft_config.sql`
- Added `draft_config` column to `scanly_sites` table
- This stores draft changes that aren't yet published

### 2. API Changes

#### `/api/site` (POST)
**File:** `src/app/api/site/route.ts`
- Detects if site exists (editing) vs new creation
- **New sites**: Saves to `config` using UPSERT (goes live immediately)
- **Existing sites being edited**: Updates only `draft_config` using UPDATE (preserves live `config`)
- **Existing sites being published**: Uses UPSERT to update both `config` and other fields

#### `/api/site` (GET)
**File:** `src/app/api/site/route.ts`
- **Edit mode** (`?edit=true`): Returns `draft_config` if exists, otherwise `config`
- **View mode** (default): Returns `config` only (published version)

#### `/api/site/publish` (POST)
**File:** `src/app/api/site/publish/route.ts`
- Copies `draft_config` to `config` (makes draft live)
- Clears `draft_config` after publishing
- Sets `published: true` and `published_at` timestamp

### 3. Frontend
**No changes needed** - The create page already works correctly:
- Loads draft when editing (`?edit=true`)
- Saves changes (now goes to draft)
- Publishes when clicking "Go live" buttons

## How to Apply

### Step 1: Run the Database Migration

You need to add the `draft_config` column to your database. You have two options:

#### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:
   ```sql
   ALTER TABLE scanly_sites ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;
   ```

#### Option B: Local Supabase CLI (if you have it set up)
```bash
supabase migration up 07_add_draft_config
```

### Step 2: Verify the Column Exists
Run the check script:
```bash
node check-draft-column.mjs
```

It should say "Column draft_config already exists!"

### Step 3: Restart Your Dev Server
```bash
npm run dev
```

## Testing the Fix

### Test 1: Create New Piqo (Should Go Live Immediately)
1. Go to `/create`
2. Fill in handle, brand name, add items
3. Click "Go live"
4. Visit `/u/yourhandle` → Changes should be visible immediately ✅

### Test 2: Edit Existing Piqo (Should Save as Draft)
1. Go to `/dashboard`
2. Click "Edit" on an existing piqo
3. Make some changes (change a price, add an item, etc.)
4. **Don't click "Go live" yet**
5. Visit `/u/yourhandle` → Changes should NOT be visible ✅
6. Go back to edit page
7. Click "Go live" or "All done! Ready to go live"
8. Visit `/u/yourhandle` → Changes should now be visible ✅

### Test 3: Verify Draft Persists
1. Start editing a piqo
2. Make some changes
3. Close the browser/navigate away
4. Come back and edit the same piqo
5. Your draft changes should still be there ✅

## Rollback (If Needed)

If something goes wrong, you can remove the column:
```sql
ALTER TABLE scanly_sites DROP COLUMN IF EXISTS draft_config;
```

Then revert the code changes by running:
```bash
git diff
git checkout -- src/app/api/site/route.ts src/app/api/site/publish/route.ts
```
