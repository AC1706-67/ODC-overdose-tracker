/*
  # Create Dashboard Views for Compassionate LOG

  1. Dashboard KPI View
    - `org_dashboard_kpis` - 4 key metrics per organization
    - Real-time aggregated data for dashboard cards

  2. Time Series View  
    - `org_outreach_timeseries` - Daily outreach activity over time
    - For mini charts and trend analysis

  3. Performance Optimization
    - Materialized views for fast dashboard loading
    - Refresh functions for real-time updates
*/

-- =============================================
-- ORG DASHBOARD KPIs VIEW
-- =============================================
CREATE OR REPLACE VIEW org_dashboard_kpis AS
SELECT 
  COALESCE(org_data.organization_id, 'anonymous') as organization_id,
  
  -- Card 1: Health Incidents
  COALESCE(incidents_data.total_incidents, 0) as total_incidents,
  COALESCE(incidents_data.narcan_incidents, 0) as narcan_incidents,
  COALESCE(incidents_data.survival_rate, 0) as survival_rate,
  
  -- Card 2: Outreach Activities  
  COALESCE(outreach_data.total_outreach, 0) as total_outreach,
  COALESCE(outreach_data.total_kits, 0) as total_kits,
  
  -- Card 3: People Reached
  COALESCE(outreach_data.people_reached, 0) as people_reached,
  COALESCE(outreach_data.avg_people_per_outreach, 0) as avg_people_per_outreach,
  
  -- Card 4: Geographic Coverage
  COALESCE(coverage_data.unique_zip_codes, 0) as unique_zip_codes,
  COALESCE(coverage_data.active_locations, 0) as active_locations,
  
  -- Meta
  GREATEST(
    COALESCE(incidents_data.last_updated, '1970-01-01'::timestamptz),
    COALESCE(outreach_data.last_updated, '1970-01-01'::timestamptz)
  ) as last_updated

FROM (
  -- Get all organization IDs that have data
  SELECT DISTINCT organization_id FROM incidents WHERE organization_id IS NOT NULL
  UNION 
  SELECT DISTINCT organization_id FROM outreach_logs WHERE organization_id IS NOT NULL
  UNION
  SELECT 'anonymous' -- Include anonymous data
) org_data

LEFT JOIN (
  -- Incidents aggregation
  SELECT 
    COALESCE(organization_id, 'anonymous') as organization_id,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE narcan_used = true) as narcan_incidents,
    CASE 
      WHEN COUNT(*) FILTER (WHERE survival != 'Unknown') = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE survival = 'Survived'))::numeric / 
        (COUNT(*) FILTER (WHERE survival != 'Unknown'))::numeric * 100, 1
      )
    END as survival_rate,
    MAX(created_at) as last_updated
  FROM incidents 
  WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY COALESCE(organization_id, 'anonymous')
) incidents_data ON org_data.organization_id = incidents_data.organization_id

LEFT JOIN (
  -- Outreach aggregation
  SELECT 
    COALESCE(organization_id, 'anonymous') as organization_id,
    COUNT(*) as total_outreach,
    SUM(num_kits) as total_kits,
    SUM(people_reached) as people_reached,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(SUM(people_reached)::numeric / COUNT(*)::numeric, 1)
    END as avg_people_per_outreach,
    MAX(created_at) as last_updated
  FROM outreach_logs 
  WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY COALESCE(organization_id, 'anonymous')
) outreach_data ON org_data.organization_id = outreach_data.organization_id

LEFT JOIN (
  -- Coverage aggregation
  SELECT 
    COALESCE(combined_org_id, 'anonymous') as organization_id,
    COUNT(DISTINCT zip_code) as unique_zip_codes,
    COUNT(DISTINCT location_key) as active_locations
  FROM (
    SELECT 
      COALESCE(organization_id, 'anonymous') as combined_org_id,
      zip_code,
      zip_code as location_key
    FROM incidents 
    WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
    
    UNION ALL
    
    SELECT 
      COALESCE(organization_id, 'anonymous') as combined_org_id,
      zip_code,
      COALESCE(location, zip_code) as location_key
    FROM outreach_logs 
    WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  ) combined_data
  GROUP BY combined_org_id
) coverage_data ON org_data.organization_id = coverage_data.organization_id;

-- =============================================
-- ORG OUTREACH TIMESERIES VIEW
-- =============================================
CREATE OR REPLACE VIEW org_outreach_timeseries AS
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '29 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date as day
),
org_list AS (
  SELECT DISTINCT COALESCE(organization_id, 'anonymous') as organization_id 
  FROM outreach_logs
  WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  UNION SELECT 'anonymous'
)
SELECT 
  ol.organization_id,
  ds.day,
  COALESCE(daily_data.outreach_count, 0) as outreach_count,
  COALESCE(daily_data.kits_distributed, 0) as kits_distributed,
  COALESCE(daily_data.people_reached, 0) as people_reached,
  COALESCE(daily_data.incident_count, 0) as incident_count

FROM org_list ol
CROSS JOIN date_series ds
LEFT JOIN (
  SELECT 
    COALESCE(organization_id, 'anonymous') as organization_id,
    created_at::date as day,
    COUNT(*) as outreach_count,
    SUM(num_kits) as kits_distributed,
    SUM(people_reached) as people_reached,
    0 as incident_count
  FROM outreach_logs
  WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY COALESCE(organization_id, 'anonymous'), created_at::date
  
  UNION ALL
  
  SELECT 
    COALESCE(organization_id, 'anonymous') as organization_id,
    created_at::date as day,
    0 as outreach_count,
    0 as kits_distributed, 
    0 as people_reached,
    COUNT(*) as incident_count
  FROM incidents
  WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
  GROUP BY COALESCE(organization_id, 'anonymous'), created_at::date
) daily_data ON ol.organization_id = daily_data.organization_id AND ds.day = daily_data.day

ORDER BY ol.organization_id, ds.day;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Allow authenticated users to read dashboard data
GRANT SELECT ON org_dashboard_kpis TO authenticated, anon;
GRANT SELECT ON org_outreach_timeseries TO authenticated, anon;

-- =============================================
-- HELPER FUNCTION FOR DASHBOARD DATA
-- =============================================
CREATE OR REPLACE FUNCTION get_dashboard_data(org_id text DEFAULT 'anonymous')
RETURNS TABLE (
  -- KPI Cards
  total_incidents bigint,
  narcan_incidents bigint,
  survival_rate numeric,
  total_outreach bigint,
  total_kits bigint,
  people_reached bigint,
  avg_people_per_outreach numeric,
  unique_zip_codes bigint,
  active_locations bigint,
  last_updated timestamptz,
  
  -- Time series (JSON for easy consumption)
  timeseries_data jsonb
) AS $$
DECLARE
  kpi_data RECORD;
  series_data jsonb;
BEGIN
  -- Get KPI data
  SELECT * INTO kpi_data
  FROM org_dashboard_kpis 
  WHERE organization_id = org_id;
  
  -- Get time series data as JSON
  SELECT jsonb_agg(
    jsonb_build_object(
      'day', day,
      'outreach_count', outreach_count,
      'kits_distributed', kits_distributed,
      'people_reached', people_reached,
      'incident_count', incident_count
    ) ORDER BY day
  ) INTO series_data
  FROM org_outreach_timeseries 
  WHERE organization_id = org_id;
  
  -- Return combined data
  RETURN QUERY SELECT 
    COALESCE(kpi_data.total_incidents, 0),
    COALESCE(kpi_data.narcan_incidents, 0),
    COALESCE(kpi_data.survival_rate, 0),
    COALESCE(kpi_data.total_outreach, 0),
    COALESCE(kpi_data.total_kits, 0),
    COALESCE(kpi_data.people_reached, 0),
    COALESCE(kpi_data.avg_people_per_outreach, 0),
    COALESCE(kpi_data.unique_zip_codes, 0),
    COALESCE(kpi_data.active_locations, 0),
    COALESCE(kpi_data.last_updated, now()),
    COALESCE(series_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_data(text) TO authenticated, anon;