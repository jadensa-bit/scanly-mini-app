-- Add draft_config column to sites table for draft editing without affecting live sites
-- This allows users to edit their Piqo without changes going live immediately

-- Add draft_config column to scanly_sites
ALTER TABLE scanly_sites 
ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN scanly_sites.draft_config IS 'Stores draft changes that have not been published yet. When null, no draft exists and config is the current state.';
