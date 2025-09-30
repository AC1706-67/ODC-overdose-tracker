-- Update gender constraint to remove 'Non-binary' option
ALTER TABLE incidents 
DROP CONSTRAINT IF EXISTS incidents_gender_check;

ALTER TABLE incidents 
ADD CONSTRAINT incidents_gender_check 
CHECK (gender IN ('Male', 'Female', 'Prefer not to say', 'Unknown'));