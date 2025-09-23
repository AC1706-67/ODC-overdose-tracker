import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardData {
  incidents: {
    total: number;
    narcanUsed: number;
    survived: number;
    survivalRate: number;
  };
  distributions: {
    total: number;
    narcan: number;
    byType: Array<{ type: string; count: number }>;
  };
  demographics: {
    gender: Array<{ gender: string; count: number }>;
    age: Array<{ age: string; count: number }>;
  };
  coverage: {
    zipCodes: number;
  };
  zipCodes: Array<{
    zipCode: string;
    incidents: number;
    distributions: number;
  }>;
}

export function useDashboardData(period: string, zipCode?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Build query filters
      let incidentsQuery = supabase
        .from('incidents')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      let distributionsQuery = supabase
        .from('distributions')
        .select('*')
        .gte('timestamp', startDate.toISOString());

      if (zipCode) {
        incidentsQuery = incidentsQuery.eq('zip_code', zipCode);
        distributionsQuery = distributionsQuery.eq('zip_code', zipCode);
      }

      // Fetch data
      const [incidentsResult, distributionsResult] = await Promise.all([
        incidentsQuery,
        distributionsQuery
      ]);

      if (incidentsResult.error) throw incidentsResult.error;
      if (distributionsResult.error) throw distributionsResult.error;

      const incidents = incidentsResult.data || [];
      const distributions = distributionsResult.data || [];

      // Process incidents data
      const totalIncidents = incidents.length;
      const narcanUsed = incidents.filter(i => i.narcan_used).length;
      const survived = incidents.filter(i => i.survival === 'Survived').length;
      const survivalRate = totalIncidents > 0 ? survived / totalIncidents : 0;

      // Process distributions data
      const totalDistributions = distributions.reduce((sum, d) => sum + d.kits_given, 0);
      const narcanDistributions = distributions
        .filter(d => d.kit_type === 'Narcan')
        .reduce((sum, d) => sum + d.kits_given, 0);

      // Distribution by type
      const distributionsByType = distributions.reduce((acc, d) => {
        const existing = acc.find(item => item.type === d.kit_type);
        if (existing) {
          existing.count += d.kits_given;
        } else {
          acc.push({ type: d.kit_type, count: d.kits_given });
        }
        return acc;
      }, [] as Array<{ type: string; count: number }>);

      // Demographics
      const genderCounts = incidents.reduce((acc, i) => {
        const existing = acc.find(item => item.gender === i.gender);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ gender: i.gender, count: 1 });
        }
        return acc;
      }, [] as Array<{ gender: string; count: number }>);

      const ageCounts = incidents.reduce((acc, i) => {
        const existing = acc.find(item => item.age === i.approx_age);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ age: i.approx_age, count: 1 });
        }
        return acc;
      }, [] as Array<{ age: string; count: number }>);

      // ZIP code analysis
      const zipCodes = new Set([
        ...incidents.map(i => i.zip_code),
        ...distributions.map(d => d.zip_code)
      ]);

      const zipCodeData = Array.from(zipCodes).map(zip => ({
        zipCode: zip,
        incidents: incidents.filter(i => i.zip_code === zip).length,
        distributions: distributions
          .filter(d => d.zip_code === zip)
          .reduce((sum, d) => sum + d.kits_given, 0)
      })).sort((a, b) => b.incidents - a.incidents);

      const dashboardData: DashboardData = {
        incidents: {
          total: totalIncidents,
          narcanUsed,
          survived,
          survivalRate,
        },
        distributions: {
          total: totalDistributions,
          narcan: narcanDistributions,
          byType: distributionsByType,
        },
        demographics: {
          gender: genderCounts,
          age: ageCounts,
        },
        coverage: {
          zipCodes: zipCodes.size,
        },
        zipCodes: zipCodeData,
      };

      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty data structure
      setData({
        incidents: { total: 0, narcanUsed: 0, survived: 0, survivalRate: 0 },
        distributions: { total: 0, narcan: 0, byType: [] },
        demographics: { gender: [], age: [] },
        coverage: { zipCodes: 0 },
        zipCodes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, zipCode]);

  const refresh = () => {
    fetchData();
  };

  return { data, loading, refresh };
}