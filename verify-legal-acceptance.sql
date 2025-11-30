-- Verify legal acceptance tracking columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('terms_accepted_at', 'privacy_accepted_at', 'accepted_version')
ORDER BY column_name;

-- Check if any existing users have accepted terms
SELECT 
  COUNT(*) as total_users,
  COUNT(terms_accepted_at) as users_with_terms,
  COUNT(privacy_accepted_at) as users_with_privacy,
  COUNT(CASE WHEN terms_accepted_at IS NULL THEN 1 END) as users_without_terms
FROM public.profiles;

-- Show sample of users with/without acceptance
SELECT 
  id,
  email,
  terms_accepted_at,
  privacy_accepted_at,
  accepted_version,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
