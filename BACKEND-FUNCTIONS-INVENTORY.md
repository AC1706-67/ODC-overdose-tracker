# Backend Functions Inventory

## Overview
This document lists all PostgreSQL functions implemented in your Supabase backend, organized by category.

---

## 🔐 Authentication & User Management

### `handle_new_user()`
**File:** `supabase/migrations/20251012_add_organizational_structure.sql`
**Type:** Trigger function
**Purpose:** Automatically creates a profile entry when a new user signs up
**Trigger:** `AFTER INSERT ON auth.users`
**Returns:** `trigger`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `auto_assign_default_organization()`
**File:** `supabase/migrations/20251126_harmonize_rls_and_prep_zip_sharing.sql`
**Type:** Trigger function
**Purpose:** Automatically assigns new users to the demo organization
**Trigger:** `AFTER INSERT ON auth.users`
**Returns:** `trigger`
**Role Assigned:** `'Tester'`

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $$
DECLARE
  demo_org_id UUID;
BEGIN
  SELECT id INTO demo_org_id
  FROM public.organizations
  WHERE is_demo_organization = true AND is_active = true
  LIMIT 1;

  IF demo_org_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (user_id, organization_id, role, is_active)
    VALUES (NEW.id, demo_org_id, 'Tester', true)
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🏢 Organization Management

### `get_user_organizations(user_uuid)`
**File:** `supabase/migrations/20251012_update_existing_tables_for_orgs.sql`
**Purpose:** Get all organizations a user belongs to
**Parameters:**
- `user_uuid` (uuid, default: `auth.uid()`)
**Returns:** Table with organization details and user role
**Security:** `SECURITY DEFINER`

```sql
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  user_role text,
  is_default boolean
)
```

### `user_has_org_permission(user_uuid, org_uuid, required_role)`
**File:** `supabase/migrations/20251012_update_existing_tables_for_orgs.sql`
**Purpose:** Check if user has specific permission level in an organization
**Parameters:**
- `user_uuid` (uuid)
- `org_uuid` (uuid)
- `required_role` (text, default: `'Responder'`)
**Returns:** `boolean`
**Security:** `SECURITY DEFINER`
**Role Hierarchy:** `['Viewer', 'Responder', 'Supervisor', 'Manager', 'Admin', 'Owner']`

### `get_organization_stats(org_uuid, start_date, end_date)`
**File:** `supabase/migrations/20251012_update_existing_tables_for_orgs.sql`
**Purpose:** Get comprehensive statistics for an organization
**Parameters:**
- `org_uuid` (uuid)
- `start_date` (timestamptz, default: `now() - 30 days`)
- `end_date` (timestamptz, default: `now()`)
**Returns:** Table with incident/distribution statistics
**Security:** `SECURITY DEFINER`

```sql
RETURNS TABLE (
  total_incidents bigint,
  total_distributions bigint,
  narcan_incidents bigint,
  survival_rate numeric,
  unique_zip_codes bigint,
  active_responders bigint
)
```

### `increment_invite_code_usage(p_code)`
**File:** `supabase/migrations/20251119_add_org_certification_and_codes.sql` (updated in `fix-invite-code-function-parameter.sql`)
**Purpose:** Increment usage count for an invite code and return org ID
**Parameters:**
- `p_code` (text) - The invite code (p_ prefix follows PostgreSQL convention)
**Returns:** `uuid` - Organization ID
**Security:** `SECURITY DEFINER`
**Side Effects:** Increments `current_uses` counter
**Frontend call:** `.rpc('increment_invite_code_usage', { p_code: code })`

---

## 📊 Dashboard & Analytics

### `get_dashboard_data(org_id)`
**File:** `supabase/migrations/20251012_create_dashboard_views.sql`
**Purpose:** Get comprehensive dashboard data for an organization
**Parameters:**
- `org_id` (text, default: `'anonymous'`)
**Returns:** Table with KPIs, trends, and analytics
**Security:** `SECURITY DEFINER`

```sql
RETURNS TABLE (
  -- KPI Cards
  total_incidents bigint,
  total_distributions bigint,
  narcan_used_count bigint,
  survival_rate numeric,
  -- Trends
  incidents_trend jsonb,
  distributions_trend jsonb,
  -- Demographics
  gender_breakdown jsonb,
  age_breakdown jsonb,
  -- Geographic
  zip_coverage bigint,
  top_zips jsonb
)
```

### `get_team_member_stats(org_uuid, start_date, end_date)`
**File:** `supabase/migrations/20251101_create_enhanced_outreach_analytics.sql`
**Purpose:** Get team member performance statistics
**Parameters:**
- `org_uuid` (uuid, default: `NULL` for all orgs)
- `start_date` (timestamptz, default: `now() - 30 days`)
- `end_date` (timestamptz, default: `now()`)
**Returns:** Table with team member activity metrics

```sql
RETURNS TABLE (
  team_member_id uuid,
  team_member_name text,
  total_activities bigint,
  total_kits_distributed bigint,
  total_people_reached bigint,
  unique_locations bigint,
  avg_kits_per_activity numeric,
  avg_people_per_activity numeric,
  first_activity_date timestamptz,
  last_activity_date timestamptz
)
```

### `get_location_analytics(org_uuid, start_date, end_date)`
**File:** `supabase/migrations/20251101_create_enhanced_outreach_analytics.sql`
**Purpose:** Get location-based outreach analytics
**Parameters:**
- `org_uuid` (uuid, default: `NULL` for all orgs)
- `start_date` (timestamptz, default: `now() - 30 days`)
- `end_date` (timestamptz, default: `now()`)
**Returns:** Table with location activity metrics

```sql
RETURNS TABLE (
  location_id uuid,
  location_name text,
  location_type text,
  zip_code text,
  total_activities bigint,
  total_kits_distributed bigint,
  total_people_reached bigint,
  unique_team_members bigint,
  avg_kits_per_visit numeric,
  avg_people_per_visit numeric,
  first_visit_date timestamptz,
  last_visit_date timestamptz
)
```

---

## 🔄 Data Migration & Validation

### `log_migration_step(migration_name, step_name, status, details)`
**File:** `supabase/migrations/20251101_complete_data_migration.sql`
**Purpose:** Log migration progress for tracking
**Parameters:**
- `migration_name` (text)
- `step_name` (text)
- `status` (text) - 'started', 'completed', 'failed'
- `details` (jsonb, default: `NULL`)
**Returns:** `void`

### `validate_complete_migration()`
**File:** `supabase/migrations/20251101_complete_data_migration.sql`
**Purpose:** Comprehensive validation of enhanced outreach migration
**Returns:** Table with validation results

```sql
RETURNS TABLE (
  validation_check text,
  status text,
  details jsonb
)
```

### `validate_team_member_migration()`
**File:** `supabase/migrations/20251101_migrate_team_member_data.sql`
**Purpose:** Validate team member data migration
**Returns:** Table with migration statistics

```sql
RETURNS TABLE (
  total_outreach_logs BIGINT,
  logs_with_team_members BIGINT,
  unique_team_members BIGINT,
  team_member_associations BIGINT,
  orphaned_associations BIGINT
)
```

### `validate_location_migration()`
**File:** `supabase/migrations/20251101_migrate_location_data.sql`
**Purpose:** Validate location data migration
**Returns:** Table with migration statistics

```sql
RETURNS TABLE (
  total_outreach_logs BIGINT,
  logs_with_locations BIGINT,
  unique_locations BIGINT,
  logs_with_location_id BIGINT,
  logs_with_legacy_location BIGINT
)
```

### `rollback_enhanced_outreach_migration()`
**File:** `supabase/migrations/20251101_complete_data_migration.sql`
**Purpose:** Emergency rollback function for enhanced outreach migration
**Returns:** `void`
**Warning:** ⚠️ Destructive operation - use with caution

---

## 🛠️ Utility Functions

### `handle_updated_at()`
**File:** `supabase/migrations/20251119_add_org_certification_and_codes.sql`
**Type:** Trigger function
**Purpose:** Automatically update `updated_at` timestamp on row changes
**Trigger:** `BEFORE UPDATE` on various tables
**Returns:** `trigger`

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `parse_location_string(location_text)`
**File:** `supabase/migrations/20251101_migrate_location_data.sql`
**Purpose:** Parse legacy location strings into structured components
**Parameters:**
- `location_text` (TEXT)
**Returns:** Table with parsed location components

```sql
RETURNS TABLE (
  parsed_name TEXT,
  parsed_address TEXT,
  parsed_city TEXT,
  parsed_state TEXT,
  parsed_zip TEXT,
  location_type TEXT
)
```

### `clean_team_member_name(name_text)`
**File:** `supabase/migrations/20251101_migrate_team_member_data.sql`
**Purpose:** Clean and normalize team member names
**Parameters:**
- `name_text` (TEXT)
**Returns:** `TEXT`
**Operations:** Trim, title case, remove extra spaces

### `extract_team_member_names(team_members_data)`
**File:** `supabase/migrations/20251101_migrate_team_member_data.sql`
**Purpose:** Extract individual names from comma-separated string
**Parameters:**
- `team_members_data` (TEXT)
**Returns:** `TEXT[]` (array of names)

---

## 📋 Function Usage Summary

### By Category
- **Authentication:** 2 functions
- **Organization Management:** 4 functions
- **Dashboard & Analytics:** 3 functions
- **Data Migration:** 4 functions
- **Utility:** 4 functions

### Security Levels
- **SECURITY DEFINER:** 10 functions (elevated privileges)
- **Regular:** 7 functions (caller privileges)

### Trigger Functions
- `handle_new_user()` - Creates profile on signup
- `auto_assign_default_organization()` - Assigns to demo org
- `handle_updated_at()` - Updates timestamps

---

## 🔍 Frontend Usage

These functions are called from the frontend via `.rpc()`:

### Commonly Used
- `get_user_organizations()` - Org picker, settings
- `user_has_org_permission()` - Permission checks
- `get_organization_stats()` - Dashboard displays
- `get_dashboard_data()` - Main dashboard
- `get_team_member_stats()` - Team analytics
- `get_location_analytics()` - Location analytics
- `increment_invite_code_usage()` - Invite code redemption

### Migration/Admin Only
- `validate_complete_migration()`
- `validate_team_member_migration()`
- `validate_location_migration()`
- `rollback_enhanced_outreach_migration()`
- `log_migration_step()`

---

## ⚠️ Important Notes

1. **SECURITY DEFINER Functions:** These run with elevated privileges. Ensure they have proper input validation and security checks.

2. **Trigger Functions:** Automatically execute on database events. Be careful with modifications as they affect all inserts/updates.

3. **Migration Functions:** Some functions are only needed during migrations and could be dropped after successful deployment.

4. **RLS Interaction:** Functions marked `SECURITY DEFINER` bypass RLS policies. Ensure they implement their own security checks.

---

## 🔄 Recommended Actions

### Cleanup Opportunities
Consider dropping these after successful migration:
- `log_migration_step()`
- `validate_complete_migration()`
- `validate_team_member_migration()`
- `validate_location_migration()`
- `parse_location_string()`
- `clean_team_member_name()`
- `extract_team_member_names()`

### Documentation Needed
Add inline documentation for:
- Input validation rules
- Expected return formats
- Error handling behavior
- Performance considerations

### Testing Recommendations
- Unit tests for utility functions
- Integration tests for org permission checks
- Load tests for analytics functions
- Security audits for SECURITY DEFINER functions
