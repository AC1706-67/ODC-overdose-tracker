-- Add enhanced outreach tracking fields

ALTER TABLE outreach_logs 
ADD COLUMN IF NOT EXISTS outreach_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS team_members TEXT,
ADD COLUMN IF NOT EXISTS team_organization TEXT,
ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 1;