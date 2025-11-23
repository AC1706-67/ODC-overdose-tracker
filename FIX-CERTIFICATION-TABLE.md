# Fix Missing Certification Requests Table

## Problem
The `organization_certification_requests` table doesn't exist in your database, causing the Request Certification form to fail.

## Root Cause
The migration `20251119_add_org_certification_and_codes.sql` creates:
- ✅ `organization_invite_codes` table
- ❌ Missing: `organization_certification_requests` table

## Solution

### Step 1: Check if Table Exists
Run this in Supabase SQL Editor:

```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'organization_certification_requests';
```

**If it returns 0 rows** → Table doesn't exist, proceed to Step 2

### Step 2: Create the Table
Copy and paste the entire contents of `create-certification-requests-table.sql` into Supabase SQL Editor and run it.

Or run this directly:

```sql
-- Create organization_certification_requests table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS cert_requests_created_by_idx ON organization_certification_requests(created_by);
CREATE INDEX IF NOT EXISTS cert_requests_status_idx ON organization_certification_requests(status);
CREATE INDEX IF NOT EXISTS cert_requests_created_at_idx ON organization_certification_requests(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS cert_requests_updated_at ON organization_certification_requests;
CREATE TRIGGER cert_requests_updated_at
  BEFORE UPDATE ON organization_certification_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Step 3: Verify
Run this to confirm:

```sql
SELECT 
  'Table created successfully!' as message,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'organization_certification_requests';
```

Should return 1 row showing the table exists.

### Step 4: Test the Form
1. Open the app
2. Go to onboarding
3. Click "Request organization certification"
4. Fill out the form
5. Submit

Should now work without errors!

## What This Table Does

**Purpose:** Stores certification requests from users who want their organization added to the platform.

**Fields:**
- `organization_name` - Name of the organization
- `organization_type` - Type (e.g., "Compassionate Community Engagement (CCE)")
- `contact_name`, `contact_email` - Who to contact
- `city`, `state`, `website`, `description` - Optional details
- `status` - 'pending', 'approved', or 'rejected'
- `created_by` - User who submitted the request
- `reviewed_by`, `reviewed_at`, `review_notes` - Admin review info

**Security (RLS):**
- Users can only see their own requests
- Users can create new requests
- Admins can view all (policy commented out - add when you have admin roles)

## Future: Admin Review Flow

Once you have admin roles set up, you can:

1. **View all pending requests:**
   ```sql
   SELECT * FROM organization_certification_requests
   WHERE status = 'pending'
   ORDER BY created_at DESC;
   ```

2. **Approve a request:**
   ```sql
   UPDATE organization_certification_requests
   SET 
     status = 'approved',
     reviewed_by = auth.uid(),
     reviewed_at = now(),
     review_notes = 'Looks good!'
   WHERE id = '<request-id>';
   ```

3. **Then create the actual organization and invite code** (manual for now)

## Files Created

- `check-certification-table.sql` - Query to check if table exists
- `create-certification-requests-table.sql` - Full migration to create table
- `FIX-CERTIFICATION-TABLE.md` - This guide
