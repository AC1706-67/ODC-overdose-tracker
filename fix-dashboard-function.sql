-- Fix the get_dashboard_data function to handle both UUID and text organization IDs
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
  safe_org_id text;
BEGIN
  -- Safely handle organization ID
  safe_org_id := COALESCE(org_id, 'anonymous');
  
  -- Get KPI data
  SELECT * INTO kpi_data
  FROM org_dashboard_kpis 
  WHERE organization_id = safe_org_id;
  
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
  WHERE organization_id = safe_org_id;
  
  -- Return combined data with safe defaults
  RETURN QUERY SELECT 
    COALESCE(kpi_data.total_incidents, 0::bigint),
    COALESCE(kpi_data.narcan_incidents, 0::bigint),
    COALESCE(kpi_data.survival_rate, 0::numeric),
    COALESCE(kpi_data.total_outreach, 0::bigint),
    COALESCE(kpi_data.total_kits, 0::bigint),
    COALESCE(kpi_data.people_reached, 0::bigint),
    COALESCE(kpi_data.avg_people_per_outreach, 0::numeric),
    COALESCE(kpi_data.unique_zip_codes, 0::bigint),
    COALESCE(kpi_data.active_locations, 0::bigint),
    COALESCE(kpi_data.last_updated, now()),
    COALESCE(series_data, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_data(text) TO authenticated, anon;