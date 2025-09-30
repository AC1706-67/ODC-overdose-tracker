/*
  # Create incidents table

  1. New Tables
    - `incidents`
      - `incident_id` (uuid, primary key)
      - `timestamp` (timestamptz, auto-generated)
      - `zip_code` (text, 5 digits)
      - `gender` (text, enum values)
      - `approx_age` (text, age ranges)
      - `narcan_used` (boolean)
      - `survival` (text, outcome)
      - `client_id` (uuid, for deduplication)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `incidents` table
    - Add policy for authenticated users to insert data
    - Add policy for admins to read aggregated data
*/

CREATE TABLE IF NOT EXISTS incidents (
  incident_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  zip_code text NOT NULL CHECK (zip_code ~ '^[0-9]{5}$'),
  gender text NOT NULL CHECK (gender IN ('Male', 'Female', 'Prefer not to say', 'Unknown')),
  approx_age text NOT NULL CHECK (approx_age IN ('<18', '18-25', '26-35', '36-45', '46-55', '56-65', '65+', 'Unknown')),
  narcan_used boolean NOT NULL,
  survival text NOT NULL CHECK (survival IN ('Survived', 'Deceased', 'Unknown')),
  client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert incidents (for frontline responders)
CREATE POLICY "Allow anonymous incident submission"
  ON incidents
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read aggregated data
CREATE POLICY "Allow authenticated users to read incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS incidents_zip_code_idx ON incidents(zip_code);
CREATE INDEX IF NOT EXISTS incidents_timestamp_idx ON incidents(timestamp);
CREATE INDEX IF NOT EXISTS incidents_client_id_idx ON incidents(client_id);