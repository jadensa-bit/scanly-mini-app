-- Create tips table for standalone tip jar feature
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handle TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tip details
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  -- Tipper info
  tipper_name TEXT,
  tipper_email TEXT,
  tipper_phone TEXT,
  message TEXT,
  
  -- Payment info
  stripe_payment_intent TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_tips_handle ON tips(handle);
CREATE INDEX idx_tips_user_id ON tips(user_id);
CREATE INDEX idx_tips_status ON tips(status);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);

-- Enable RLS
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Users can see their own tips
CREATE POLICY "Users can view their own tips"
  ON tips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert tips for their own handle
CREATE POLICY "Users can create tips for their handle"
  ON tips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tips
CREATE POLICY "Users can update their own tips"
  ON tips
  FOR UPDATE
  USING (auth.uid() = user_id);
