-- Add team_member_name column to bookings table to store the selected staff member's name
-- This allows us to display the staff name even if they're from config (not team_members table)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS team_member_name TEXT;
