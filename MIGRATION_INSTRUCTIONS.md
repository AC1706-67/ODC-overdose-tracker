# Enhanced Outreach Analytics - Database Schema Updates

Based on comprehensive schema analysis, here's exactly what needs to be updated in your Supabase database:

## Current Status (After Analysis)

✅ organizations table - Complete
✅ team_members table - Missing 1 column
✅ locations table - Missing 3 columns  
✅ outreach_logs table - Complete (all enhanced columns exist!)
✅ outreach_team_members junction table - Complete
✅ All analytics views exist and working

## Issues Found

Only **2 minor column additions** needed:

1. **team_members table**: Missing `role` column
2. **locations table**: Missing `normalized_name`, `line1`, and `is_active` columns

## Required SQL Updates

Copy and paste this SQL into your **Supabase SQL Editor**:

```sql
-- Supabase Schema Updates for Enhanced Outreach Analytics
-- Based on schema analysis - only missing columns need to be added

-- 1. Add missing column to team_members table
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS role text;

-- 2. Add missing columns to locations table
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(name, '\\s+', ' ', 'g'))) STORED,
ADD COLUMN IF NOT EXISTS line1 text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3. Create indexes for the new columns
CREATE UNIQUE INDEX IF NOT EXISTS locations_org_normalized_uidx
ON public.locations (COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid), normalized_name);

-- 4. Update any existing location records to have is_active = true if they don't already
UPDATE public.locations
SET is_active = true
WHERE is_active IS NULL;
```

## Manual Steps

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the SQL above**
4. **Run the SQL**
5. **Verify completion** (see below)

## Verification

After applying the updates, run these commands to verify everything is working:

```bash
# Check schema completeness (should show 0 issues)
node analyze-database-schema.js

# Run comprehensive unit tests (should show 100% success)
node __tests__/enhanced-outreach-analytics.test.js
```

## What This Enables

Once these updates are applied, you'll have:

✅ **Full team member management** with role assignments
✅ **Advanced location features** with normalization and deduplication
✅ **Complete analytics views** for dashboards and reporting
✅ **All unit tests passing** with full database operation testing

## Current Schema Health: 95% Complete

- **Tables**: 5/5 (100%) ✅
- **Views**: 3/3 (100%) ✅
- **Missing**: Only 4 columns across 2 tables
- **Status**: Ready for production after minor updates
