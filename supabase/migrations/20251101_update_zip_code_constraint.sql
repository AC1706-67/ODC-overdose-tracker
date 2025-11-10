/*
  # Update ZIP code constraint to allow NA and Unknown values

  1. Changes
    - Remove the existing CHECK constraint on zip_code
    - Add new CHECK constraint that allows 5-digit numbers, 'NA', or 'Unknown'

  2. Security
    - No changes to RLS policies needed
*/

-- Drop the existing constraint
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_zip_code_check;

-- Add new constraint that allows 5-digit ZIP codes, 'NA', or 'Unknown'
ALTER TABLE incidents ADD CONSTRAINT incidents_zip_code_check 
  CHECK (zip_code ~ '^[0-9]{5}$' OR zip_code IN ('NA', 'Unknown'));