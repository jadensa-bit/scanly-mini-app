-- Add delivery fields to scanly_orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='delivery_method') THEN
    ALTER TABLE scanly_orders ADD COLUMN delivery_method TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='delivery_fee_cents') THEN
    ALTER TABLE scanly_orders ADD COLUMN delivery_fee_cents INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scanly_orders' AND column_name='delivery_address') THEN
    ALTER TABLE scanly_orders ADD COLUMN delivery_address JSONB;
  END IF;
END $$;
