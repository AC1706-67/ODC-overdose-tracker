-- List all test accounts with their organizations

SELECT 
  p.email,
  p.full_name,
  o.name as organization,
  uo.role,
  'Use "Forgot Password" in Supabase Auth to reset' as password_reset_note
FROM profiles p
JOIN user_organizations uo ON uo.user_id = p.id
JOIN organizations o ON o.id = uo.organization_id
ORDER BY o.name, p.email;

-- Quick reference for testing:
-- Email: achavez@recoveryalliance.net
-- Org: Recovery Alliance of El Paso
-- Role: Admin
-- 
-- If you don't know the password, you have two options:
-- 1. Use a different test account (see list above)
-- 2. Reset password in Supabase Dashboard:
--    - Go to Authentication > Users
--    - Find the user
--    - Click "..." menu > "Send password recovery"
--    - Or manually set a new password
