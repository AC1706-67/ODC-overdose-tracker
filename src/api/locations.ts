import { SupabaseClient } from '@supabase/supabase-js';

export async function createLocation(
  supabase: SupabaseClient,
  orgSlug: string,
  name: string
) {
  const clean = name?.trim();
  if (!clean) throw new Error('Please enter a location name.');

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) throw new Error('You must be signed in.');

  const { data: loc, error } = await supabase.rpc('create_location_simple_v2', {
    p_name_or_intersection: clean,
  });

  if (error) throw new Error(error.message || 'Could not create location.');

  return loc as {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    location_type: string;
    is_active: boolean;
    created_at: string;
  };
}
