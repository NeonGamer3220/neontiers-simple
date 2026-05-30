-- Add retired column to tests table if it doesn't exist
-- Run this separately if the retirement feature is needed
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS retired BOOLEAN DEFAULT false;

-- Create index for faster queries on retired status
CREATE INDEX IF NOT EXISTS idx_tests_retired ON tests(retired);

-- Add the column to existing rows without it (in case IF NOT EXISTS doesn't populate)
-- Note: This will set all existing players as active (not retired)
UPDATE tests 
SET retired = false 
WHERE retired IS NULL;