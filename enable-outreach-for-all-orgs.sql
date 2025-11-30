-- ============================================================================
-- ENABLE OUTREACH FOR ALL ORGANIZATIONS
-- ============================================================================
-- Everyone who onboards gets outreach access - no restrictions
-- This includes RAEP, Anonymous Haven, and any future organizations
-- ============================================================================

-- Step 1: Enable outreach for ALL existing organizations
UPDATE public.organizations
SET 
  outreach_enabled = true,
  updated_at = now()
WHERE outreach_enabled = false OR outreach_enabled IS NULL;

-- Step 2: Set default to true for future organizations
ALTER TABLE public.organizations 
ALTER COLUMN outreach_enabled SET DEFAULT true;

-- Step 3: Verify the changes
SELECT 
  name,
  slug,
  outreach_enabled,
  is_active,
  CASE 
    WHEN outreach_enabled = true THEN '✅ Outreach enabled'
    ELSE '❌ Outreach disabled'
  END as status
FROM public.organizations
ORDER BY name;

-- Step 4: Show summary
SELECT 
  COUNT(*) as total_orgs,
  COUNT(*) FILTER (WHERE outreach_enabled = true) as outreach_enabled_count,
  COUNT(*) FILTER (WHERE outreach_enabled = false) as outreach_disabled_count,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE outreach_enabled = true) 
    THEN '✅ All organizations have outreach enabled'
    ELSE '⚠️ Some organizations still have outreach disabled'
  END as summary
FROM public.organizations;
