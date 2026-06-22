BEGIN;

-- First, set any NULL or problematic values to '0' (Unranked)
UPDATE tests SET rank = '0' WHERE rank IS NULL OR rank = '';

-- Update tests table: convert tier strings to ELO numbers
UPDATE tests
SET rank = CASE 
    WHEN rank = 'Unranked' THEN '0'
    WHEN rank = 'RLT5' THEN '500'
    WHEN rank = 'RHT5' THEN '750'
    WHEN rank = 'RLT4' THEN '1000'
    WHEN rank = 'RHT4' THEN '1250'
    WHEN rank = 'RLT3' THEN '1500'
    WHEN rank = 'RHT3' THEN '1750'
    WHEN rank = 'RLT2' THEN '2000'
    WHEN rank = 'RHT2' THEN '2250'
    WHEN rank = 'HT2' THEN '2250'
    WHEN rank = 'RLT1' THEN '2500'
    WHEN rank = 'RHT1' THEN '2750'
    WHEN rank = 'LT1' THEN '2500'
    WHEN rank = 'HT1' THEN '2750'
    ELSE rank
END;

-- Now change column type to integer (all values are now valid strings or numbers)
ALTER TABLE tests 
    ALTER COLUMN rank TYPE INTEGER USING (rank::integer);

-- Note: If discord_notifications table exists, run this to convert tested_tier_start to INTEGER:
-- ALTER TABLE discord_notifications ALTER COLUMN tested_tier_start TYPE INTEGER USING (NULL);

COMMIT;