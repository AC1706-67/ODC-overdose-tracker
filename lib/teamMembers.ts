import { supabase } from '@/lib/supabase';

export type CreatedMember = {
  id: string;
  organization_id: string;
  full_name: string; // returned as full_name from SQL
  created_at: string;
};

export async function createTeamMember(
  orgSlug: string,
  fullName: string,
): Promise<CreatedMember> {
  const clean = fullName?.trim();
  if (!clean) throw new Error('Please enter a name.');

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) throw new Error('You must be signed in.');

  const { data, error } = await supabase.rpc('create_team_member_simple', {
    p_org_slug: orgSlug,
    p_full_name: clean,
  });

  if (error) throw new Error(error.message || 'Could not create team member.');

  return data as CreatedMember;
}
