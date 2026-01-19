-- Add draft_config column to sites table (in addition to scanly_sites)
-- This allows draft editing for sites stored in the sites table

-- Add draft_config column to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN sites.draft_config IS 'Stores draft changes that have not been published yet. When null, no draft exists and config is the current state.';
