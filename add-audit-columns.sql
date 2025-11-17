-- Add audit/tracking columns to all main tables
-- This ensures every record knows WHO created it and WHEN

-- 1. Incidents table
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set created_by for existing records (if any don't have it)
-- This is safe - it won't overwrite existing values
UPDATE incidents 
SET created_by = auth.uid() 
WHERE created_by IS NULL;

-- 2. Outreach logs table
ALTER TABLE outreach_logs 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE outreach_logs 
SET created_by = auth.uid() 
WHERE created_by IS NULL;

-- 3. Distributions table (if you have one)
ALTER TABLE distributions 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE distributions 
SET created_by = auth.uid() 
WHERE created_by IS NULL;

-- 4. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to incidents
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to outreach_logs
DROP TRIGGER IF EXISTS update_outreach_logs_updated_at ON outreach_logs;
CREATE TRIGGER update_outreach_logs_updated_at
    BEFORE UPDATE ON outreach_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to distributions
DROP TRIGGER IF EXISTS update_distributions_updated_at ON distributions;
CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT 
  'incidents' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'incidents' 
  AND column_name IN ('created_at', 'created_by', 'updated_at', 'organization_id')
UNION ALL
SELECT 
  'outreach_logs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'outreach_logs' 
  AND column_name IN ('created_at', 'created_by', 'updated_at', 'organization_id')
ORDER BY table_name, column_name;
