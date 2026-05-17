-- Add tested_tier_start column to discord_notifications table
-- This column stores the starting tier before the test (for Discord notifications)
ALTER TABLE discord_notifications 
ADD COLUMN IF NOT EXISTS tested_tier_start TEXT;

-- Create index for faster queries on this column
CREATE INDEX IF NOT EXISTS idx_discord_notifications_tested_tier_start 
ON discord_notifications(tested_tier_start);