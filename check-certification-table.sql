-- Check if organization_certification_requests table exists

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'organization_certification_requests';

-- If the above returns no rows, the table doesn't exist
-- Run the migration below to create it
