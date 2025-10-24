/*
  # Create outreach_logs table for Compassionate LOG

  1. New Table
    - `outreach_logs` - Comprehensive outreach activity tracking
      - Replaces the narrow "distributions" concept
      - Supports multiple kit types per outreach event
      - Tracks people reached and location details

  2. Security
    - Enable RLS with organization-based access
    - Allow authenticated users to insert/read their org data
*/

CREATE TABLE IF NOT EXISTS outreach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zip_code text NOT NULL CHECK (zip_code ~ '^[0-9]{5}$'),
  location text, -- Specific location details
  kit_types text[] NOT NULL DEFAULT '{}', -- Array of kit types
  num_kits integer NOT NULL DEFAULT 0 CHECK (num_kits >= 0),
  people_reached integer NOT NULL DEFAULT 0 CHECK (people_reached >= 0),
  notes text,
  organization_id uuid REFERENCES organizations(id),
  submitted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert outreach logs for their organizations
CREATE POLICY "Users can submit outreach logs for their orgs"
  ON outreach_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow anonymous submissions
  );

-- Allow anonymous submissions (for public health emergency use)
CREATE POLICY "Allow anonymous outreach log submission"
  ON outreach_logs
  FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NULL);

-- Users can view outreach logs from their organizations
CREATE POLICY "Users can view org outreach logs"
  ON outreach_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow viewing anonymous submissions
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS outreach_logs_zip_code_idx ON outreach_logs(zip_code);
CREATE INDEX IF NOT EXISTS outreach_logs_created_at_idx ON outreach_logs(created_at);
CREATE INDEX IF NOT EXISTS outreach_logs_organization_idx ON outreach_logs(organization_id);
CREATE INDEX IF NOT EXISTS outreach_logs_submitted_by_idx ON outreach_logs(submitted_by);
CREATE INDEX IF NOT EXISTS outreach_logs_kit_types_idx ON outreach_logs USING GIN(kit_types);

-- Trigger for updated_at
CREATE TRIGGER outreach_logs_updated_at
  BEFORE UPDATE ON outreach_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();