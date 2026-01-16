-- Create slots table for booking availability
CREATE TABLE IF NOT EXISTS slots (
  id BIGSERIAL PRIMARY KEY,
  creator_handle TEXT NOT NULL,
  team_member_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_creator_handle ON slots(creator_handle);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON slots(start_time);

-- Create bookings table for customer bookings
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  handle TEXT NOT NULL,
  slot_id BIGINT REFERENCES slots(id) ON DELETE CASCADE,
  team_member_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  item_title TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  checked_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_handle ON bookings(handle);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Create orders table for product/digital purchases
CREATE TABLE IF NOT EXISTS scanly_orders (
  id BIGSERIAL PRIMARY KEY,
  handle TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  item_title TEXT,
  item_price TEXT,
  mode TEXT, -- products, digital, services
  status TEXT DEFAULT 'pending', -- pending, completed, refunded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scanly_orders_handle ON scanly_orders(handle);
CREATE INDEX IF NOT EXISTS idx_scanly_orders_created_at ON scanly_orders(created_at);

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anyone to insert bookings (public)
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Allow public to view their own bookings by email
CREATE POLICY "Public can view their own bookings"
  ON bookings FOR SELECT
  USING (true);

-- Enable realtime on bookings table for dashboard live updates
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE slots;
ALTER PUBLICATION supabase_realtime ADD TABLE scanly_orders;
