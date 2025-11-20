# Migration Best Practices Applied

## Overview
Refactored `20251119_add_org_certification_and_codes.sql` to follow PostgreSQL and Supabase best practices.

## Best Practices Implemented

### 1. ✅ Proper Ordering
```
Step 1: Functions (dependencies first)
Step 2: Table alterations
Step 3: New tables
Step 4: Enable RLS
Step 5: RLS policies
Step 6: Indexes
Step 7: Triggers (after functions exist)
Step 8: Helper functions
Step 9: Data updates
Step 10: Data inserts
```

### 2. ✅ Idempotency
All operations can be safely re-run:
- `CREATE OR REPLACE FUNCTION`
- `CREATE TABLE IF NOT EXISTS`
- `ADD COLUMN IF NOT EXISTS`
- `DROP POLICY IF EXISTS` before `CREATE POLICY`
- `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- `ON CONFLICT DO NOTHING` for inserts
- `WHERE is_certified IS NOT TRUE` for updates

### 3. ✅ Constraint Management
```sql
DO $$ 
BEGIN
  ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_status_check;
  ALTER TABLE organizations ADD CONSTRAINT organizations_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
```

### 4. ✅ Function Safety
- Used `public.` schema prefix
- `SECURITY DEFINER` for privileged operations
- `STABLE` volatility category (reads data, doesn't modify)
- Returns `NULL` when no match (explicit behavior)
- Comprehensive comments

### 5. ✅ Transaction Safety
- No `CREATE INDEX CONCURRENTLY` (which can't run in transactions)
- All operations are transaction-safe
- Can be wrapped in `BEGIN...COMMIT` if needed

### 6. ✅ Error Handling
```sql
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
```

### 7. ✅ Data Safety
- Conditional updates: `WHERE is_certified IS NOT TRUE`
- Existence checks: `AND EXISTS (SELECT 1 FROM ...)`
- Conflict resolution: `ON CONFLICT (code) DO NOTHING`

### 8. ✅ Documentation
- Comprehensive header comment
- Step-by-step comments
- Inline explanations for complex logic
- Clear section separators

### 9. ✅ Verification Script
Created `verify-onboarding-migration.sql` to check:
- Column existence
- Table creation
- RLS policies
- Indexes
- Functions
- Triggers
- Constraints
- Sample data

## Migration Execution

### Safe Execution
```sql
-- Option 1: Run entire migration (idempotent)
-- Copy/paste entire file into Supabase SQL Editor

-- Option 2: Wrap in transaction (optional)
BEGIN;
  -- paste migration here
COMMIT;

-- Option 3: Run verification after
-- Run verify-onboarding-migration.sql
```

### Rollback Strategy
If needed, rollback is straightforward:
```sql
-- Drop new table
DROP TABLE IF EXISTS organization_invite_codes CASCADE;

-- Remove new columns
ALTER TABLE organizations 
  DROP COLUMN IF EXISTS is_certified,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS contact_email,
  DROP COLUMN IF EXISTS contact_name,
  DROP COLUMN IF EXISTS certification_notes;

-- Drop function
DROP FUNCTION IF EXISTS public.increment_invite_code_usage(text);
```

## Comparison: Before vs After

### Before
- ❌ Constraints inline with CREATE TABLE (not idempotent)
- ❌ No function existence check
- ❌ Policies not dropped before creation
- ❌ Trigger used PROCEDURE instead of FUNCTION
- ❌ Function not marked STABLE
- ❌ Less comprehensive documentation

### After
- ✅ Constraints added separately with error handling
- ✅ Function created/replaced first
- ✅ Policies dropped before creation
- ✅ Trigger uses FUNCTION (modern syntax)
- ✅ Function properly marked STABLE
- ✅ Comprehensive documentation and verification

## Testing Checklist

- [ ] Run migration in development environment
- [ ] Run verification script
- [ ] Test onboarding flow with code entry
- [ ] Test onboarding flow with org selection
- [ ] Test onboarding flow with org request
- [ ] Verify RLS policies work correctly
- [ ] Test code usage increment function
- [ ] Re-run migration (should succeed with no errors)
- [ ] Test rollback procedure
- [ ] Run in production

## Files

- `supabase/migrations/20251119_add_org_certification_and_codes.sql` - Production-ready migration
- `verify-onboarding-migration.sql` - Verification queries
- `ONBOARDING_FLOW_IMPLEMENTATION.md` - Feature documentation
- `MIGRATION_BEST_PRACTICES_APPLIED.md` - This file
