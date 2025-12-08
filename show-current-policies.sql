-- Show ALL current policies on user_organizations
-- Run this FIRST to see what's causing the recursion

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  CASE 
    WHEN qual LIKE '%user_organizations%' THEN '❌ RECURSIVE!'
    ELSE '✅ Safe'
  END as "Status",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;
