-- Inspect the team_members table schema to see the actual column names
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'team_members' 
    AND tc.table_schema = 'public';