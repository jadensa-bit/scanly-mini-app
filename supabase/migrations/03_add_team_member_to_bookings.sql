-- Add team_member_id column to bookings table if it doesn't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS team_member_id UUID;
