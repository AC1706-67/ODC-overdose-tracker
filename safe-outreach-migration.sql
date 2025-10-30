-- Safe step-by-step outreach schema migration
-- Run each section separately in Supabase SQL editor

-- STEP 1: Add columns (run this first)
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS outreach_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS team_members TEXT;
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS team_organization TEXT;
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 1;
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS males_reached INTEGER DEFAULT 0;
ALTER TABLE outreach_logs ADD COLUMN IF NOT EXISTS females_reached INTEGER DEFAULT 0;

-- STEP 2: Set NOT NULL constraints (run after Step 1 succeeds)
ALTER TABLE outreach_logs ALTER COLUMN trip_count SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN males_reached SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN females_reached SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN outreach_date SET NOT NULL;

-- STEP 3: Create indexes (run each separately)
-- Check if index exists first, then create if needed
CREATE INDEX idx_outreach_logs_outreach_date ON outreach_logs (outreach_date);
CREATE INDEX idx_outreach_logs_org_date ON outreach_logs (organization_id, outreach_date);
CREATE INDEX idx_outreach_logs_team_org ON outreach_logs (team_organization);

-- STEP 4: Update incidents gender constraint
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_gender_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_gender_check 
CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say', 'Unknown'));

-- STEP 5: Add data integrity constraints
-- Note: Use DO blocks for conditional constraint creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_trip_count_positive' 
        AND conrelid = 'outreach_logs'::regclass
    ) THEN
        ALTER TABLE outreach_logs ADD CONSTRAINT check_trip_count_positive 
        CHECK (trip_count > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_gender_counts_non_negative' 
        AND conrelid = 'outreach_logs'::regclass
    ) THEN
        ALTER TABLE outreach_logs ADD CONSTRAINT check_gender_counts_non_negative 
        CHECK (males_reached >= 0 AND females_reached >= 0);
    END IF;
END $$;