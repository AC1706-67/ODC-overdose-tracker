-- Add outreach_enabled column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS outreach_enabled BOOLEAN DEFAULT false;

-- Enable outreach for Recovery Alliance of El Paso
UPDATE organizations 
SET outreach_enabled = true 
WHERE slug IN ('recovery-alliance-el-paso', 'recovery-alliance', 'raep')
   OR id = '6e892800-0429-442f-bff8-417b4d4ec793';

-- Verify the update
SELECT id, slug, name, outreach_enabled 
FROM organizations 
WHERE outreach_enabled = true;
