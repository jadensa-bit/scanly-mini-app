-- Add user_id column to sites table for proper user ownership tracking
-- This ensures all piqos are associated with their creator

-- Add user_id column to sites table (if it doesn't exist)
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);

-- Update existing sites without user_id to link them by owner_email
-- This migration script should be run manually to avoid affecting existing data
-- UPDATE sites SET user_id = (SELECT id FROM auth.users WHERE email = sites.owner_email) WHERE user_id IS NULL AND owner_email IS NOT NULL;

COMMENT ON COLUMN sites.user_id IS 'Foreign key to auth.users - identifies the creator/owner of this Piqo';
