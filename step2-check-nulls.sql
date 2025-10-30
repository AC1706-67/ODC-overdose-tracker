-- Step 2: Check for NULL values before setting NOT NULL constraints
SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE trip_count IS NULL) as null_trip_counts,
  COUNT(*) FILTER (WHERE males_reached IS NULL) as null_males,
  COUNT(*) FILTER (WHERE females_reached IS NULL) as null_females,
  COUNT(*) FILTER (WHERE outreach_date IS NULL) as null_dates
FROM outreach_logs;

-- Show any records with NULL values (if any exist)
SELECT id, trip_count, males_reached, females_reached, outreach_date
FROM outreach_logs 
WHERE trip_count IS NULL 
   OR males_reached IS NULL 
   OR females_reached IS NULL 
   OR outreach_date IS NULL
LIMIT 10;