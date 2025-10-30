-- Optimized outreach enhancements with performance and data integrity improvements

-- Add all new columns to outreach_logs table
ALTER TABLE outreach_logs 
ADD COLUMN IF NOT EXISTS outreach_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS team_members TEXT,
ADD COLUMN IF NOT EXISTS team_organization TEXT,
ADD COLUMN IF NOT EXISTS trip_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS males_reached INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS females_reached INTEGER DEFAULT 0;

-- Set NOT NULL constraints for fields that should always have values
ALTER TABLE outreach_logs ALTER COLUMN trip_count SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN males_reached SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN females_reached SET NOT NULL;
ALTER TABLE outreach_logs ALTER COLUMN outreach_date SET NOT NULL;

-- Add performance indexes for frequently queried fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outreach_logs_outreach_date ON outreach_logs (outreach_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outreach_logs_org_date ON outreach_logs (organization_id, outreach_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outreach_logs_team_org ON outreach_logs (team_organization);

-- Update gender constraint for incidents table to include 'Other'
ALTER TABLE incidents 
DROP CONSTRAINT IF EXISTS incidents_gender_check;

ALTER TABLE incidents 
ADD CONSTRAINT incidents_gender_check 
CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say', 'Unknown'));

-- Add check constraints for data integrity
ALTER TABLE outreach_logs 
ADD CONSTRAINT IF NOT EXISTS check_trip_count_positive 
CHECK (trip_count > 0);

ALTER TABLE outreach_logs 
ADD CONSTRAINT IF NOT EXISTS check_gender_counts_non_negative 
CHECK (males_reached >= 0 AND females_reached >= 0);

-- Verification queries
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'outreach_logs' 
AND column_name IN ('outreach_date', 'team_members', 'team_organization', 'trip_count', 'males_reached', 'females_reached')
ORDER BY column_name;

-- Check indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'outreach_logs' 
AND indexname LIKE 'idx_outreach_logs_%';

-- Test data integrity constraints
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE trip_count IS NULL) as null_trip_counts,
  COUNT(*) FILTER (WHERE males_reached IS NULL) as null_males,
  COUNT(*) FILTER (WHERE females_reached IS NULL) as null_females
FROM outreach_logs;