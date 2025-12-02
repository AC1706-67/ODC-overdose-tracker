const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function testRecursionFix() {
  console.log('🔍 Testing if infinite recursion is fixed...\n');

  try {
    // Test 1: Check user_organizations table access
    console.log('1. Testing user_organizations table access...');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(5);

    if (userOrgsError) {
      if (userOrgsError.message.includes('infinite recursion')) {
        console.log('❌ STILL HAS INFINITE RECURSION:', userOrgsError.message);
        return false;
      } else {
        console.log(
          '⚠️ Different error (might be expected):',
          userOrgsError.message,
        );
      }
    } else {
      console.log('✅ user_organizations table accessible');
      console.log('   Found', userOrgs?.length || 0, 'records');
    }

    // Test 2: Check organizations table access
    console.log('\n2. Testing organizations table access...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(5);

    if (orgsError) {
      if (orgsError.message.includes('infinite recursion')) {
        console.log('❌ STILL HAS INFINITE RECURSION:', orgsError.message);
        return false;
      } else {
        console.log(
          '⚠️ Different error (might be expected):',
          orgsError.message,
        );
      }
    } else {
      console.log('✅ organizations table accessible');
      console.log('   Found', orgs?.length || 0, 'records');
    }

    // Test 3: Test the dashboard views we created earlier
    console.log('\n3. Testing dashboard views...');
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('org_dashboard_kpis')
      .select('*')
      .limit(1);

    if (dashboardError) {
      console.log('⚠️ Dashboard view error:', dashboardError.message);
    } else {
      console.log('✅ Dashboard views accessible');
      console.log('   Sample data:', dashboardData);
    }

    // Test 4: Test outreach_logs table
    console.log('\n4. Testing outreach_logs table...');
    const { data: outreachData, error: outreachError } = await supabase
      .from('outreach_logs')
      .select('count')
      .limit(1);

    if (outreachError) {
      console.log('⚠️ Outreach logs error:', outreachError.message);
    } else {
      console.log('✅ outreach_logs table accessible');
    }

    console.log('\n🎉 SUCCESS: No infinite recursion detected!');
    console.log('The database should now work with the app.');
    return true;
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

testRecursionFix();
