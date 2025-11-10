import { supabase } from '@/lib/supabase';

export async function fetchDashboardDirect(activeOrgId: string | null) {
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  
  let query = supabase
    .from("outreach_logs")
    .select("num_kits, people_reached, males_reached, females_reached, location")
    .gte("created_at", since);
  
  // If activeOrgId is null, get anonymous data (where organization_id is null)
  if (activeOrgId === null) {
    query = query.is("organization_id", null);
  } else {
    query = query.eq("organization_id", activeOrgId);
  }
  
  const { data, error } = await query;
    
  if (error) throw error;

  const outreach_activities = data?.length ?? 0;
  const kits_distributed = (data ?? []).reduce((s, r) => s + (r.num_kits || 0), 0);
  const people_reached = (data ?? []).reduce((s, r) => s + (r.people_reached || 0), 0);
  const males_reached = (data ?? []).reduce((s, r) => s + (r.males_reached || 0), 0);
  const females_reached = (data ?? []).reduce((s, r) => s + (r.females_reached || 0), 0);
  const active_locations = new Set((data ?? []).map(r => (r.location || "").trim()).filter(Boolean)).size;

  return { 
    outreach_activities, 
    kits_distributed, 
    people_reached, 
    males_reached, 
    females_reached, 
    active_locations 
  };
}