-- Add missing columns to scanly_orders table for checkout functionality
ALTER TABLE scanly_orders 
  ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS stripe_connected_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_items JSONB;

-- Add index on stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scanly_orders_stripe_session ON scanly_orders(stripe_session_id);

-- Add index on paid status for filtering
CREATE INDEX IF NOT EXISTS idx_scanly_orders_paid ON scanly_orders(paid);
