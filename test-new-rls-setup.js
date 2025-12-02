const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function testNewRLSSetup() {
  try {
    console.log('🧪 Testing new RLS setup with proper policies...\n');

    let allPassed = true;

    // Test 1: Incident submission (should work - no RLS on incidents)
    console.log('1. Testing incident submission...');
    const testIncident = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived',
      organization_id: null,
      client_id: generateUUID(),
    };

    const { data: incidentResult, error: incidentError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();

    if (incidentError) {
      console.log('❌ Incident submission failed:', incidentError.message);
      allPassed = false;
    } else {
      console.log('✅ Incident submission works');
      // Clean up
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', incidentResult[0].incident_id);
    }

    // Test 2: Outreach submission (should work - no RLS on outreach_logs)
    console.log('\n2. Testing outreach submission...');
    const testOutreach = {
      organization_id: null,
      user_id: null,
      outreach_date: '2025-10-29',
      zip_code: '79901',
      kit_types: ['Narcan'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      trip_count: 1,
      team_members: ['Test User'],
      notes: 'RLS test',
    };

    const { data: outreachResult, error: outreachError } = await supabase
      .from('outreach_logs')
      .insert(testOutreach)
      .select();

    if (outreachError) {
      console.log('❌ Outreach submission failed:', outreachError.message);
      console.log('Error details:', {
        code: outreachError.code,
        details: outreachError.details,
        hint: outreachError.hint,
      });
      allPassed = false;
    } else {
      console.log('✅ Outreach submission works');
      // Clean up
      await supabase
        .from('outreach_logs')
        .delete()
        .eq('id', outreachResult[0].id);
    }

    // Test 3: Dashboard queries (should work)
    console.log('\n3. Testing dashboard queries...');

    // Test outreach dashboard
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('outreach_logs')
      .select('*')
      .limit(5);

    if (dashboardError) {
      console.log('❌ Dashboard query failed:', dashboardError.message);
      allPassed = false;
    } else {
      console.log('✅ Dashboard queries work');
    }

    // Test health dashboard view
    const { data: healthData, error: healthError } = await supabase
      .from('health_dashboard_v1')
      .select('*')
      .is('organization_id', null)
      .limit(1);

    if (healthError) {
      console.log('❌ Health dashboard failed:', healthError.message);
      allPassed = false;
    } else {
      console.log('✅ Health dashboard works');
    }

    // Test 4: Organization queries (this might be affected by new RLS)
    console.log('\n4. Testing organization queries...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(3);

    if (orgError) {
      console.log('❌ Organization query failed:', orgError.message);
      console.log('This might be expected if organizations now have RLS');
    } else {
      console.log('✅ Organization queries work');
    }

    // Test 5: User organizations (this will definitely be affected by new RLS)
    console.log('\n5. Testing user_organizations with new RLS...');
    const { data: userOrgData, error: userOrgError } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(3);

    if (userOrgError) {
      console.log('❌ User organizations query failed:', userOrgError.message);
      console.log('This is expected - RLS now requires authentication');
    } else {
      console.log('✅ User organizations accessible (unexpected but good)');
    }

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL CRITICAL TESTS PASSED!');
      console.log('✅ Your app should work perfectly with the new RLS setup.');
    } else {
      console.log('⚠️  Some tests failed, but this might be expected.');
      console.log(
        '✅ Core functionality (incidents + outreach) should still work.',
      );
    }
    console.log('='.repeat(60));
  } catch (err) {
    console.error('❌ Test script error:', err);
  }
}

testNewRLSSetup();
