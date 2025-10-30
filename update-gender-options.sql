-- Update gender constraint to include 'Other' option

ALTER TABLE incidents 
DROP CONSTRAINT IF EXISTS incidents_gender_check;

ALTER TABLE incidents 
ADD CONSTRAINT incidents_gender_check 
CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say', 'Unknown'));