-- Step 1: Add all new columns to outreach_logs table
ALTER TABLE outreach_logs 
ADD COLUMN IF NOT EXISTS outreach_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS team_members TEXT,
ADD COLUMN IF NOT EXISTS team_organization TEXT,
ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS males_reached INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS females_reached INTEGER DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'outreach_logs' 
AND column_name IN ('outreach_date', 'team_members', 'team_organization', 'trip_count', 'males_reached', 'females_reached')
ORDER BY column_name;