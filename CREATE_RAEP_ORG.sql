-- Run this in Supabase SQL Editor to create the Recovery Alliance organization

-- Insert the organization with the canonical ID
INSERT INTO organizations (id, slug, name, is_active)
VALUES (
  '6e892800-0429-442f-bff8-417b4d4ec793',
  'raep',
  'Recovery Alliance of El Paso',
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- Verify it was created
SELECT * FROM organizations;
