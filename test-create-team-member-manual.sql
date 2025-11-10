-- Manual test for create_team_member function
-- Run this in your Supabase SQL Editor to test the function

-- Test 1: Create a new team member
SELECT create_team_member(
  'John Test User',
  'john.test@example.com', 
  'Volunteer',
  'recovery-alliance-el-paso'
);

-- Test 2: Try to create the same member again (should update)
SELECT create_team_member(
  'John Test User',
  'john.updated@example.com', 
  'Coordinator',
  'recovery-alliance-el-paso'
);

-- Test 3: Create member for Communities for Recovery
SELECT create_team_member(
  'Jane Test User',
  'jane.test@example.com', 
  'Peer Support',
  'communities-for-recovery'
);

-- Verify the results
SELECT id, name, email, role, organization_id, created_at, updated_at 
FROM team_members 
WHERE name LIKE '%Test User%'
ORDER BY created_at DESC;