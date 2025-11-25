-- Get the actual column names and types for outreach_logs table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'outreach_logs'
ORDER BY ordinal_position;
