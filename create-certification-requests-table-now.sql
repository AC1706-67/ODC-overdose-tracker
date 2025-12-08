-- Create certification_requests table for organization onboarding
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.certification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  organization_type text NOT NULL,
  city text,
  state text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certification_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (submit a request)
CREATE POLICY "Anyone can submit org requests"
ON public.certification_requests
FOR INSERT
WITH CHECK (true);

-- Only you (admins) can view/update requests
-- For now, we'll skip the SELECT policy since you'll view in SQL Editor
-- Later you can add: WHERE auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certification_requests_status 
ON public.certification_requests(status);

CREATE INDEX IF NOT EXISTS idx_certification_requests_created_at 
ON public.certification_requests(created_at DESC);

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'certification_requests'
ORDER BY ordinal_position;
