import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface OrgDashboardKPIs {
  // Card 1: Health Incidents
  total_incidents: number;
  narcan_incidents: number;
  survival_rate: number;
  
  // Card 2: Outreach Activities
  total_outreach: number;
  total_kits: number;
  
  // Card 3: People Reached
  people_reached: number;
  avg_people_per_outreach: number;
  
  // Card 4: Geographic Coverage
  unique_zip_codes: number;
  active_locations: number;
  
  // Meta
  last_updated: string;
}

export interface OutreachTimeSeriesPoint {
  day: string;
  outreach_count: number;
  kits_distributed: number;
  people_reached: number;
  incident_count: number;
}

export function useOrgDashboard(organizationId: string = 'anonymous') {
  const [kpis, setKpis] = useState<OrgDashboardKPIs | null>(null);
  const [timeSeries, setTimeSeries] = useState<OutreachTimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the 4 card numbers for the current org
      const { data: kpiData, error: kpiError } = await supabase
        .from('org_dashboard_kpis')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (kpiError && kpiError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw kpiError;
      }

      // Optional: mini chart for last 30 days
      const { data: series, error: seriesError } = await supabase
        .from('org_outreach_timeseries')
        .select('*')
        .eq('organization_id', organizationId)
        .order('day', { ascending: true });

      if (seriesError) {
        console.warn('Time series data unavailable:', seriesError);
      }

      setKpis(kpiData || {
        total_incidents: 0,
        narcan_incidents: 0,
        survival_rate: 0,
        total_outreach: 0,
        total_kits: 0,
        people_reached: 0,
        avg_people_per_outreach: 0,
        unique_zip_codes: 0,
        active_locations: 0,
        last_updated: new Date().toISOString(),
      });

      setTimeSeries(series || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [organizationId]);

  return {
    kpis,
    timeSeries,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}

// Alternative hook using the helper function (more efficient)
export function useOrgDashboardOptimized(organizationId: string = 'anonymous') {
  const [data, setData] = useState<{
    kpis: OrgDashboardKPIs;
    timeSeries: OutreachTimeSeriesPoint[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: fetchError } = await supabase
        .rpc('get_dashboard_data', { org_id: organizationId });

      if (fetchError) throw fetchError;

      if (result && result.length > 0) {
        const row = result[0];
        setData({
          kpis: {
            total_incidents: row.total_incidents,
            narcan_incidents: row.narcan_incidents,
            survival_rate: row.survival_rate,
            total_outreach: row.total_outreach,
            total_kits: row.total_kits,
            people_reached: row.people_reached,
            avg_people_per_outreach: row.avg_people_per_outreach,
            unique_zip_codes: row.unique_zip_codes,
            active_locations: row.active_locations,
            last_updated: row.last_updated,
          },
          timeSeries: row.timeseries_data || [],
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [organizationId]);

  return {
    kpis: data?.kpis || null,
    timeSeries: data?.timeSeries || [],
    loading,
    error,
    refresh: fetchDashboardData,
  };
}