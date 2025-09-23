/*
  # Create distributions table

  1. New Tables
    - `distributions`
      - `distribution_id` (uuid, primary key)
      - `timestamp` (timestamptz, auto-generated)
      - `zip_code` (text, 5 digits)
      - `kit_type` (text, enum values)
      - `kits_given` (integer)
      - `last_kit_outcome` (text, optional for Narcan)
      - `responder_id` (uuid, optional)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `distributions` table
    - Add policies for data access
*/

CREATE TABLE IF NOT EXISTS distributions (
  distribution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  zip_code text NOT NULL CHECK (zip_code ~ '^[0-9]{5}$'),
  kit_type text NOT NULL CHECK (kit_type IN ('Narcan', 'Feminine Hygiene', 'Hygiene', 'Safe Sex')),
  kits_given integer NOT NULL CHECK (kits_given > 0 AND kits_given <= 50),
  last_kit_outcome text CHECK (last_kit_outcome IN ('Used in overdose', 'Expired', 'Lost', 'Still have it', 'Given to someone else', 'Unknown')),
  responder_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert distributions
CREATE POLICY "Allow anonymous distribution submission"
  ON distributions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read distributions
CREATE POLICY "Allow authenticated users to read distributions"
  ON distributions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS distributions_zip_code_idx ON distributions(zip_code);
CREATE INDEX IF NOT EXISTS distributions_timestamp_idx ON distributions(timestamp);
CREATE INDEX IF NOT EXISTS distributions_kit_type_idx ON distributions(kit_type);