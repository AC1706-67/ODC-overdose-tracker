-- Add legal acceptance tracking to profiles table
-- This tracks when users accept Terms of Service and Privacy Policy

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_version text DEFAULT '1.0';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when user accepted Terms of Service';
COMMENT ON COLUMN public.profiles.privacy_accepted_at IS 'Timestamp when user accepted Privacy Policy';
COMMENT ON COLUMN public.profiles.accepted_version IS 'Version of terms/privacy policy that user accepted';

-- Create index for querying users who haven't accepted terms
CREATE INDEX IF NOT EXISTS idx_profiles_terms_acceptance 
  ON public.profiles(terms_accepted_at) 
  WHERE terms_accepted_at IS NULL;
