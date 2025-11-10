import { supabase } from '@/lib/supabase';

export type CreatedLocation = {
  id: string;
  name: string;
  created_at: string;
};

export async function createLocation(
  orgSlug: string,
  name: string
): Promise<CreatedLocation> {
  const clean = name?.trim();
  if (!clean) throw new Error('Please enter a location name.');

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) throw new Error('You must be signed in.');

  const { data, error } = await supabase.rpc('create_location_simple_v2', {
    p_org_slug: orgSlug,
    p_name: clean,
  });

  if (error) throw new Error(error.message || 'Could not create location.');

  return data as CreatedLocation;
}
