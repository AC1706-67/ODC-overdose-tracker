import { supabase } from '@/src/lib/supabase';

export async function submitOutreach(values: any, activeOrgId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  if (!activeOrgId) throw new Error("No organization selected");

  const { error } = await supabase.from("outreach_logs").insert([{
    user_id: user.id,
    organization_id: activeOrgId,
    zip_code: values.zip,
    location: values.location ?? null,
    kit_types: values.kitTypes,
    num_kits: Number(values.numKits || 0),
    people_reached: Number(values.peopleReached || 0),
    notes: values.notes ?? null
  }]);
  
  if (error) throw error;
}