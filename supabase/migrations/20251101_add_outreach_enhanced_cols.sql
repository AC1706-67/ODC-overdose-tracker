-- Add enhanced outreach columns SAFELY
-- This migration adds the missing columns needed for location analytics

-- Add location_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'location_id') THEN
        ALTER TABLE public.outreach_logs ADD COLUMN location_id uuid;
        RAISE NOTICE 'Added location_id column to outreach_logs';
    ELSE
        RAISE NOTICE 'location_id column already exists in outreach_logs';
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'outreach_logs_location_id_fkey'
    ) THEN
        ALTER TABLE public.outreach_logs 
        ADD CONSTRAINT outreach_logs_location_id_fkey 
        FOREIGN KEY (location_id) 
        REFERENCES public.locations(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for location_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for location_id';
    END IF;
END $$;

-- Add legacy columns for migration compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'legacy_location') THEN
        ALTER TABLE public.outreach_logs ADD COLUMN legacy_location text;
        RAISE NOTICE 'Added legacy_location column to outreach_logs';
    ELSE
        RAISE NOTICE 'legacy_location column already exists in outreach_logs';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'legacy_team_members') THEN
        ALTER TABLE public.outreach_logs ADD COLUMN legacy_team_members text[];
        RAISE NOTICE 'Added legacy_team_members column to outreach_logs';
    ELSE
        RAISE NOTICE 'legacy_team_members column already exists in outreach_logs';
    END IF;
END $$;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_outreach_logs_location_id 
ON public.outreach_logs(location_id);

CREATE INDEX IF NOT EXISTS idx_outreach_logs_legacy_location 
ON public.outreach_logs(legacy_location);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.outreach_logs TO authenticated;
GRANT SELECT ON public.locations TO authenticated, anon;

-- Verify the changes
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'outreach_logs' 
    AND column_name IN ('location_id', 'legacy_location', 'legacy_team_members');
    
    RAISE NOTICE 'Enhanced outreach columns added: % out of 3', col_count;
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ All enhanced outreach columns successfully added!';
    ELSE
        RAISE WARNING '⚠️  Some columns may be missing. Please check manually.';
    END IF;
END $$;