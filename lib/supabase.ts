import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.warn('Supabase env vars missing at runtime:', { urlPresent: !!url, anonPresent: !!anon });
}

export const supabase = createClient(url!, anon!);