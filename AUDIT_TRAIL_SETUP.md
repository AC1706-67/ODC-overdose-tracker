# Audit Trail Setup Guide

## Current State (Based on Your Analysis)

### ✅ Already Exists:
- `created_by` column on all tables (incidents, outreach_logs, distributions)
- `created_at` column on all tables
- `organization_id` column on all tables
- RLS is enabled on all tables

### ❌ Missing:
- `updated_at` column on all tables
- Triggers to auto-update `updated_at` on row changes

## Setup Instructions

### Step 1: Verify Current State
Run `verify-audit-columns.sql` in Supabase SQL Editor to see exactly what you have.

### Step 2: Add Missing Columns and Triggers
Run `add-missing-updated-at.sql` in Supabase SQL Editor.

This will:
- Add `updated_at` column to incidents, outreach_logs, distributions
- Create the `update_updated_at_column()` function
- Create triggers to auto-update `updated_at` on every UPDATE

### Step 3: Apply RLS Policies
Run `setup-org-based-rls.sql` to create organization-based access control.

## What Each Column Does

### `created_by` (UUID)
- **Purpose**: Tracks WHO created the record
- **Set by**: `auth.uid()` default or app code
- **Never changes**: Set once on INSERT

### `created_at` (TIMESTAMPTZ)
- **Purpose**: Tracks WHEN the record was created
- **Set by**: `NOW()` default
- **Never changes**: Set once on INSERT

### `updated_at` (TIMESTAMPTZ)
- **Purpose**: Tracks WHEN the record was last modified
- **Set by**: Trigger function on UPDATE
- **Auto-updates**: Every time the row is updated

### `organization_id` (UUID)
- **Purpose**: Tracks WHICH organization owns the record
- **Set by**: App code on INSERT
- **Used for**: RLS policies to isolate org data

## Testing the Audit Trail

After setup, test with:

```sql
-- Insert a test record
INSERT INTO incidents (organization_id, created_by, ...)
VALUES ('your-org-id', auth.uid(), ...);

-- Check the timestamps
SELECT id, created_at, updated_at FROM incidents WHERE id = 'new-record-id';
-- created_at and updated_at should be the same

-- Update the record
UPDATE incidents SET some_field = 'new value' WHERE id = 'new-record-id';

-- Check again
SELECT id, created_at, updated_at FROM incidents WHERE id = 'new-record-id';
-- created_at stays the same, updated_at is newer!
```

## Benefits

1. **Accountability**: Know who created every record
2. **Audit Trail**: Track when records were created and modified
3. **Data Isolation**: Organizations can't see each other's data
4. **Compliance**: Meet regulatory requirements for data tracking
5. **Debugging**: Easier to troubleshoot data issues

## Files in This Setup

- `verify-audit-columns.sql` - Check current state
- `add-missing-updated-at.sql` - Add missing columns and triggers
- `setup-org-based-rls.sql` - Apply RLS policies
- `MULTI_ORG_ARCHITECTURE.md` - Complete architecture docs
