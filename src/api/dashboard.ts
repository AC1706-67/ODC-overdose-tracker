import { supabase } from '../lib/supabase';

export async function fetchDashboardDirect(activeOrgId: string) {
  const since = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  
  const { data, error } = await supabase
    .from("outreach_logs")
    .select("num_kits, people_reached, location")
    .eq("organization_id", activeOrgId)
    .gte("created_at", since);
    
  if (error) throw error;

  const outreach_activities = data?.length ?? 0;
  const kits_distributed = (data ?? []).reduce((s, r) => s + (r.num_kits || 0), 0);
  const people_reached = (data ?? []).reduce((s, r) => s + (r.people_reached || 0), 0);
  const active_locations = new Set((data ?? []).map(r => (r.location || "").trim()).filter(Boolean)).size;

  return { outreach_activities, kits_distributed, people_reached, active_locations };
}