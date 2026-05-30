-- Add tested_tier_start column to discord_notifications table
-- This column stores the starting ELO tier before the test (for Discord notifications)
-- Note: If column exists as TEXT, you may need to convert: tested_tier_start INTEGER
ALTER TABLE discord_notifications 
ALTER COLUMN tested_tier_start TYPE INTEGER USING (NULL);

-- Create index for faster queries on this column
CREATE INDEX IF NOT EXISTS idx_discord_notifications_tested_tier_start 
ON discord_notifications(tested_tier_start) WHERE tested_tier_start IS NOT NULL;