-- Add missing columns to scanly_orders table for checkout functionality
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='paid') THEN
	ALTER TABLE scanly_orders ADD COLUMN paid BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='amount_cents') THEN
	ALTER TABLE scanly_orders ADD COLUMN amount_cents INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='currency') THEN
	ALTER TABLE scanly_orders ADD COLUMN currency TEXT DEFAULT 'usd';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='stripe_connected_account_id') THEN
	ALTER TABLE scanly_orders ADD COLUMN stripe_connected_account_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='stripe_session_id') THEN
	ALTER TABLE scanly_orders ADD COLUMN stripe_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='platform_fee_cents') THEN
	ALTER TABLE scanly_orders ADD COLUMN platform_fee_cents INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='order_items') THEN
	ALTER TABLE scanly_orders ADD COLUMN order_items JSONB;
  END IF;
END $$;

-- Add index on stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_scanly_orders_stripe_session ON scanly_orders(stripe_session_id);

-- Add index on paid status for filtering
CREATE INDEX IF NOT EXISTS idx_scanly_orders_paid ON scanly_orders(paid);
