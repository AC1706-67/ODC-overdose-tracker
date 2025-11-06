/*
  # Create Missing Analytics Views
  
  Creates the missing views referenced in the OutreachDashboardScreen:
  1. v_team_performance_v1 - Team member performance metrics
  2. v_location_coverage_v1 - Location coverage analytics
  3. v_activity_timeline_v1 - Activity timeline for recent activities
*/

-- =============================================
-- TEAM PERFORMANCE VIEW
-- =============================================
CREATE OR REPLACE VIEW v_team_performance_v1 AS
SELECT 
  tm.id as team_member_id,
  tm.name as full_name,
  tm.organization_id,
  o.name as organization_name,
  COUNT(otm.outreach_log_id) as activities_count,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
  COALESCE(SUM(ol.num_kits), 0) as total_kits_distributed,
  MAX(ol.outreach_date) as last_activity_at,
  MIN(ol.outreach_date) as first_activity_at
FROM team_members tm
LEFT JOIN outreach_team_members otm ON tm.id = otm.team_member_id
LEFT JOIN outreach_logs ol ON otm.outreach_log_id = ol.id 
  AND ol.outreach_date >= (CURRENT_DATE - INTERVAL '30 days')
LEFT JOIN organizations o ON tm.organization_id = o.id
WHERE tm.is_active = true
GROUP BY tm.id, tm.name, tm.organization_id, o.name;

-- =============================================
-- LOCATION COVERAGE VIEW
-- =============================================
CREATE OR REPLACE VIEW v_location_coverage_v1 AS
SELECT 
  l.id as location_id,
  l.name as location_label,
  l.zip_code,
  l.city,
  l.state,
  l.location_type,
  COUNT(ol.id) as visits_count,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
  COALESCE(SUM(ol.num_kits), 0) as total_kits_distributed,
  COUNT(DISTINCT otm.team_member_id) as unique_team_members,
  MAX(ol.outreach_date) as last_seen_at,
  MIN(ol.outreach_date) as first_seen_at,
  ol.organization_id
FROM locations l
LEFT JOIN outreach_logs ol ON l.id = ol.location_id 
  AND ol.outreach_date >= (CURRENT_DATE - INTERVAL '30 days')
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
WHERE l.is_active = true
GROUP BY l.id, l.name, l.zip_code, l.city, l.state, l.location_type, ol.organization_id;

-- =============================================
-- ACTIVITY TIMELINE VIEW
-- =============================================
CREATE OR REPLACE VIEW v_activity_timeline_v1 AS
SELECT 
  ol.id as outreach_log_id,
  ol.outreach_date as created_at,
  ol.organization_id,
  o.name as organization_name,
  l.name as location_name,
  l.zip_code,
  ol.people_reached,
  ol.num_kits,
  ol.notes,
  ARRAY_AGG(tm.name ORDER BY tm.name) FILTER (WHERE tm.name IS NOT NULL) as team_members
FROM outreach_logs ol
LEFT JOIN organizations o ON ol.organization_id = o.id
LEFT JOIN locations l ON ol.location_id = l.id
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
LEFT JOIN team_members tm ON otm.team_member_id = tm.id
WHERE ol.outreach_date >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY ol.id, ol.outreach_date, ol.organization_id, o.name, l.name, l.zip_code, ol.people_reached, ol.num_kits, ol.notes
ORDER BY ol.outreach_date DESC;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT SELECT ON v_team_performance_v1 TO authenticated, anon;
GRANT SELECT ON v_location_coverage_v1 TO authenticated, anon;
GRANT SELECT ON v_activity_timeline_v1 TO authenticated, anon;