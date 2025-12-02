const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function checkDB() {
  try {
    console.log('\n=== Testing basic queries ===');

    // Test organizations table
    console.log('\n1. Organizations table:');
    const {
      data: orgs,
      error: orgsError,
      count,
    } = await supabase.from('organizations').select('*', { count: 'exact' });

    console.log('Error:', orgsError);
    console.log('Count:', count);
    console.log('Data:', orgs);

    // Test if we can see ANY data
    console.log('\n2. Health incidents (for comparison):');
    const { data: incidents, error: incError } = await supabase
      .from('health_incidents')
      .select('id')
      .limit(5);

    console.log('Error:', incError);
    console.log('Count:', incidents?.length);

    // Check current user
    console.log('\n3. Current user:');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log('User:', user?.email, user?.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDB();
