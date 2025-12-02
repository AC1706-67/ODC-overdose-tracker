require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function testHealthDashboardQuery() {
  console.log('=== Testing Health Dashboard Query ===\n');

  // Test 1: Query with null organization_id (what the app does)
  console.log('1. Query with organization_id IS NULL...');
  const { data: nullOrgData, error: nullOrgError } = await supabase
    .from('health_dashboard_v1')
    .select('*')
    .is('organization_id', null)
    .limit(1);

  if (nullOrgError) {
    console.log('❌ Error:', nullOrgError.message);
  } else {
    console.log('✅ Result:', JSON.stringify(nullOrgData, null, 2));
  }

  // Test 2: Query without any filter
  console.log('\n2. Query without filter...');
  const { data: allData, error: allError } = await supabase
    .from('health_dashboard_v1')
    .select('*');

  if (allError) {
    console.log('❌ Error:', allError.message);
  } else {
    console.log(`✅ Found ${allData?.length || 0} rows`);
    console.log('Data:', JSON.stringify(allData, null, 2));
  }

  // Test 3: Check if view has RLS enabled
  console.log('\n3. Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .rpc('pg_policies')
    .eq('tablename', 'health_dashboard_v1');

  if (policyError) {
    console.log('Note: Cannot check policies (expected with anon key)');
  }

  // Test 4: Try authenticated query (if we have a user)
  console.log('\n4. Testing with authentication...');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (user) {
    console.log(`✅ Authenticated as: ${user.email}`);

    const { data: authData, error: authQueryError } = await supabase
      .from('health_dashboard_v1')
      .select('*')
      .is('organization_id', null)
      .limit(1);

    if (authQueryError) {
      console.log('❌ Auth query error:', authQueryError.message);
    } else {
      console.log('✅ Auth query result:', JSON.stringify(authData, null, 2));
    }
  } else {
    console.log('❌ Not authenticated');
  }
}

testHealthDashboardQuery().catch(console.error);
