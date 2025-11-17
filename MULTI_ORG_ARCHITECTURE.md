# Multi-Organization Architecture

## Overview
This app supports multiple organizations with proper data isolation and audit trails.

## Current Organizations
1. **Recovery Alliance of El Paso** (RAEP) - ID: `6e892800-0429-442f-bff8-417b4d4ec793`
2. **Communities for Recovery** (C4R)

## Architecture

### 1. User Authentication
- **No anonymous users** - all users must sign up with email/password
- Each user gets a UUID in `auth.users`
- Users can belong to one or more organizations

### 2. Core Tables

#### `organizations`
```sql
- id (uuid, primary key)
- slug (text, unique)
- name (text)
- is_active (boolean)
```

#### `user_organizations` (junction table)
```sql
- user_id (uuid, references auth.users)
- organization_id (uuid, references organizations)
- role (text: 'viewer', 'responder', 'supervisor', 'admin')
- is_active (boolean)
```

#### Data Tables (incidents, outreach_logs, distributions)
```sql
- id (uuid, primary key)
- organization_id (uuid, references organizations) -- WHO OWNS THIS
- created_by (uuid, references auth.users)         -- WHO CREATED THIS
- created_at (timestamptz, default now())          -- WHEN CREATED
- updated_at (timestamptz, auto-updated)           -- WHEN LAST MODIFIED
- ... other fields ...
```

### 3. Row Level Security (RLS)

**The Golden Rule:**
> Users can only see/modify data from organizations they belong to

**Implementation:**
```sql
-- Example for incidents table
CREATE POLICY incidents_org_select ON incidents
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);
```

This means:
- ✅ RAEP users only see RAEP incidents
- ✅ C4R users only see C4R incidents
- ✅ Users in both orgs see data from both
- ❌ Users can't see data from orgs they don't belong to

### 4. Audit Trail

Every record tracks:
- **created_by**: Which user created it
- **created_at**: When it was created
- **updated_at**: When it was last modified (auto-updated via trigger)

This gives you:
- Full accountability
- Ability to track who did what
- Timestamps for all changes

## Setup Instructions

### Step 1: Add Audit Columns
Run `add-audit-columns.sql` in Supabase SQL Editor to add tracking columns to all tables.

### Step 2: Setup RLS Policies
Run `setup-org-based-rls.sql` to create organization-based access control.

### Step 3: Create Organizations
Run `setup-raep-and-user.sql` to create the Recovery Alliance organization.

### Step 4: Link Users to Organizations
```sql
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES (
  'USER_UUID_HERE',
  '6e892800-0429-442f-bff8-417b4d4ec793', -- RAEP
  'admin',
  true
);
```

## App Integration

### When Creating Records
```typescript
const { data, error } = await supabase
  .from('incidents')
  .insert({
    organization_id: activeOrg.id,  // From OrgContext
    created_by: user.id,             // Auto-set by RLS
    // ... other fields
  });
```

### When Querying Records
```typescript
// RLS automatically filters by user's organizations
const { data, error } = await supabase
  .from('incidents')
  .select('*');
// Only returns incidents from user's orgs!
```

## Benefits

1. **Data Isolation**: Organizations can't see each other's data
2. **Audit Trail**: Know who created/modified every record
3. **Scalability**: Easy to add more organizations
4. **Security**: Enforced at database level (can't be bypassed)
5. **Flexibility**: Users can belong to multiple orgs

## Future Enhancements

- Add `updated_by` column to track who made changes
- Create audit log table for detailed change history
- Add organization-level settings/preferences
- Implement cross-org data sharing (if needed)
