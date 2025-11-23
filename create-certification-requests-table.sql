-- Create organization_certification_requests table
-- This table stores requests from users to certify their organizations

CREATE TABLE IF NOT EXISTS organization_certification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  organization_type text NOT NULL,
  city text,
  state text,
  website text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint for status values
ALTER TABLE organization_certification_requests 
DROP CONSTRAINT IF EXISTS certification_requests_status_check;

ALTER TABLE organization_certification_requests 
ADD CONSTRAINT certification_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Enable RLS
ALTER TABLE organization_certification_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
DROP POLICY IF EXISTS "Users can read own certification requests" ON organization_certification_requests;
CREATE POLICY "Users can read own certification requests"
  ON organization_certification_requests
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can create certification requests
DROP POLICY IF EXISTS "Users can create certification requests" ON organization_certification_requests;
CREATE POLICY "Users can create certification requests"
  ON organization_certification_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Admins can view all requests (you'll need to define who admins are)
-- For now, commented out - uncomment and adjust when you have admin roles
/*
DROP POLICY IF EXISTS "Admins can view all certification requests" ON organization_certification_requests;
CREATE POLICY "Admins can view all certification requests"
  ON organization_certification_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'Owner'
        AND is_active = true
    )
  );
*/

-- Indexes for performance
CREATE INDEX IF NOT EXISTS cert_requests_created_by_idx ON organization_certification_requests(created_by);
CREATE INDEX IF NOT EXISTS cert_requests_status_idx ON organization_certification_requests(status);
CREATE INDEX IF NOT EXISTS cert_requests_created_at_idx ON organization_certification_requests(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS cert_requests_updated_at ON organization_certification_requests;
CREATE TRIGGER cert_requests_updated_at
  BEFORE UPDATE ON organization_certification_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verify it was created
SELECT 
  'Table created successfully!' as message,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'organization_certification_requests';
