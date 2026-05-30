-- Create discord_notifications table for bot notifications
CREATE TABLE IF NOT EXISTS discord_notifications (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    gamemode TEXT NOT NULL,
    tested_tier_start INTEGER,
    result TEXT,
    fight_notes JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_discord_notifications_processed 
    ON discord_notifications(processed);