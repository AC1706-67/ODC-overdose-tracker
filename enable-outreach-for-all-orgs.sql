-- Enable outreach for all organizations

-- Step 1: Check current outreach_enabled status
SELECT 
  id,
  name,
  slug,
  is_active,
  outreach_enabled,
  CASE 
    WHEN outreach_enabled = true THEN '✅ Enabled'
    WHEN outreach_enabled = false THEN '❌ Disabled'
    ELSE '⚠️ NULL (not set)'
  END as status
FROM organizations
ORDER BY name;

-- Step 2: Enable outreach for ALL organizations
UPDATE organizations
SET outreach_enabled = true
WHERE outreach_enabled IS NULL OR outreach_enabled = false;

-- Step 3: Verify all organizations now have outreach enabled
SELECT 
  '✅ AFTER UPDATE' as step,
  id,
  name,
  slug,
  outreach_enabled
FROM organizations
ORDER BY name;
