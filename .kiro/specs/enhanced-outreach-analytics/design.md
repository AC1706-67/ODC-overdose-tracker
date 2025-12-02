# Enhanced Outreach Analytics Design

## Overview

This design implements a normalized database schema for tracking team members, locations, and outreach activities with full multi-organization support. The design maintains backward compatibility while adding powerful analytics capabilities.

## Architecture

### Database Schema Design

#### New Tables

**1. team_members**

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**2. locations**

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- e.g., "Montana & Sioux"
  address TEXT,
  zip_code VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(50),
  coordinates POINT, -- For future mapping features
  location_type VARCHAR(50), -- 'intersection', 'address', 'area'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**3. outreach_team_members** (Junction Table)

```sql
CREATE TABLE outreach_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_log_id UUID REFERENCES outreach_logs(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id),
  role_in_activity VARCHAR(100), -- 'lead', 'volunteer', 'coordinator'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Enhanced Existing Tables

**outreach_logs** (Add location reference)

```sql
ALTER TABLE outreach_logs
ADD COLUMN location_id UUID REFERENCES locations(id),
ADD COLUMN legacy_location TEXT, -- Keep original location field for migration
ADD COLUMN legacy_team_members TEXT[]; -- Keep original team_members for migration
```

### Data Migration Strategy

#### Phase 1: Schema Creation

1. Create new tables with proper indexes and constraints
2. Add new columns to existing tables
3. Set up RLS policies for multi-organization support

#### Phase 2: Data Migration

1. Extract unique locations from existing outreach_logs.location field
2. Create location records with normalized data
3. Extract team member names from existing team_members arrays
4. Create team_member records linked to appropriate organizations
5. Create junction table records linking outreach activities to team members

#### Phase 3: Application Updates

1. Update outreach submission form to use new schema
2. Enhance dashboard with new analytics
3. Maintain backward compatibility during transition

## Components and Interfaces

### Database Views for Analytics

**1. team_member_stats_v1**

```sql
CREATE VIEW team_member_stats_v1 AS
SELECT
  tm.id,
  tm.name,
  tm.organization_id,
  o.name as organization_name,
  COUNT(otm.outreach_log_id) as total_activities,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  SUM(ol.people_reached) as total_people_reached,
  MAX(ol.outreach_date) as last_activity_date
FROM team_members tm
LEFT JOIN outreach_team_members otm ON tm.id = otm.team_member_id
LEFT JOIN outreach_logs ol ON otm.outreach_log_id = ol.id
LEFT JOIN organizations o ON tm.organization_id = o.id
WHERE tm.is_active = true
GROUP BY tm.id, tm.name, tm.organization_id, o.name;
```

**2. location_analytics_v1**

```sql
CREATE VIEW location_analytics_v1 AS
SELECT
  l.id,
  l.name,
  l.zip_code,
  l.city,
  COUNT(ol.id) as total_activities,
  SUM(ol.people_reached) as total_people_reached,
  SUM(ol.num_kits) as total_kits_distributed,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  MAX(ol.outreach_date) as last_activity_date,
  COUNT(DISTINCT otm.team_member_id) as unique_team_members
FROM locations l
LEFT JOIN outreach_logs ol ON l.id = ol.location_id
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
GROUP BY l.id, l.name, l.zip_code, l.city;
```

**3. activity_timeline_v1**

```sql
CREATE VIEW activity_timeline_v1 AS
SELECT
  ol.id as outreach_id,
  ol.outreach_date,
  ol.organization_id,
  o.name as organization_name,
  l.name as location_name,
  l.zip_code,
  ol.people_reached,
  ol.num_kits,
  ARRAY_AGG(tm.name ORDER BY tm.name) as team_members,
  ol.notes
FROM outreach_logs ol
LEFT JOIN organizations o ON ol.organization_id = o.id
LEFT JOIN locations l ON ol.location_id = l.id
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
LEFT JOIN team_members tm ON otm.team_member_id = tm.id
GROUP BY ol.id, ol.outreach_date, ol.organization_id, o.name, l.name, l.zip_code, ol.people_reached, ol.num_kits, ol.notes
ORDER BY ol.outreach_date DESC;
```

## Data Models

### TypeScript Interfaces

```typescript
interface TeamMember {
  id: string;
  name: string;
  organization_id: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Location {
  id: string;
  name: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type: 'intersection' | 'address' | 'area';
  is_active: boolean;
  created_at: string;
}

interface OutreachTeamMember {
  id: string;
  outreach_log_id: string;
  team_member_id: string;
  role_in_activity?: string;
  created_at: string;
}

interface EnhancedOutreachLog {
  id: string;
  organization_id?: string;
  location_id?: string;
  outreach_date: string;
  zip_code: string;
  kit_types: string[];
  num_kits: number;
  people_reached: number;
  males_reached: number;
  females_reached: number;
  trip_count: number;
  notes?: string;
  team_members: TeamMember[];
  location: Location;
}
```

## Error Handling

### Migration Error Handling

- Validate all foreign key relationships before migration
- Provide detailed logging for data transformation issues
- Implement rollback procedures for failed migrations
- Maintain data integrity checks throughout the process

### Runtime Error Handling

- Handle missing team member or location references gracefully
- Provide fallback to legacy data when new schema data is unavailable
- Validate organization access permissions for multi-tenant security

## Testing Strategy

### Unit Tests

- Test data migration scripts with sample data
- Validate view queries return expected results
- Test RLS policies for proper organization isolation

### Integration Tests

- Test complete outreach submission flow with new schema
- Validate dashboard analytics with migrated data
- Test multi-organization data isolation

### Performance Tests

- Benchmark query performance with large datasets
- Test index effectiveness for common analytics queries
- Validate migration performance with production-sized data
