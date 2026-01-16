-- Create scanly_sites table to store published sites
CREATE TABLE IF NOT EXISTS scanly_sites (
  id BIGSERIAL PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  owner_email TEXT,
  stripe_account_id TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scanly_sites_user_id ON scanly_sites(user_id);

-- Create index on handle for faster lookups
CREATE INDEX IF NOT EXISTS idx_scanly_sites_handle ON scanly_sites(handle);

-- Enable RLS (Row Level Security)
ALTER TABLE scanly_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sites
CREATE POLICY "Users can view their own sites"
  ON scanly_sites FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only update their own sites
CREATE POLICY "Users can update their own sites"
  ON scanly_sites FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own sites
CREATE POLICY "Users can insert their own sites"
  ON scanly_sites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own sites
CREATE POLICY "Users can delete their own sites"
  ON scanly_sites FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to manage all sites (for API routes)
CREATE POLICY "Service role can manage all sites"
  ON scanly_sites FOR ALL
  USING (current_user = 'postgres');
