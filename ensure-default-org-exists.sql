-- Ensure the default organization exists for self-service signup
-- Run this in Supabase SQL Editor

-- Create Anonymous Haven AI if it doesn't exist
INSERT INTO public.organizations (name, slug, is_active, is_public, outreach_enabled)
VALUES ('Anonymous Haven AI', 'anonymous-haven-ai', true, true, true)
ON CONFLICT (slug) DO UPDATE
SET 
  is_active = true,
  is_public = true,
  outreach_enabled = true;

-- Verify it exists
SELECT id, name, slug, is_active, is_public, outreach_enabled
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- Expected: 1 row showing Anonymous Haven AI with all flags true
