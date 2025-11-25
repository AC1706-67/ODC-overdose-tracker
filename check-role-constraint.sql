-- Check the constraint definition for user_organizations table
SELECT 
  conname, 
  pg_get_constraintdef(c.oid) AS definition 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'user_organizations';

-- Check column types and nullability
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_organizations'
ORDER BY ordinal_position;
