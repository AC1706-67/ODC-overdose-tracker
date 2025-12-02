const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...');

  try {
    // Test 1: Check if dashboard views exist
    console.log('\n1. Testing org_dashboard_kpis view...');
    const { data: kpiData, error: kpiError } = await supabase
      .from('org_dashboard_kpis')
      .select('*')
      .limit(1);

    if (kpiError) {
      console.log('❌ org_dashboard_kpis view error:', kpiError.message);
    } else {
      console.log('✅ org_dashboard_kpis view exists');
      console.log('Sample data:', kpiData);
    }

    // Test 2: Check if timeseries view exists
    console.log('\n2. Testing org_outreach_timeseries view...');
    const { data: timeseriesData, error: timeseriesError } = await supabase
      .from('org_outreach_timeseries')
      .select('*')
      .limit(1);

    if (timeseriesError) {
      console.log(
        '❌ org_outreach_timeseries view error:',
        timeseriesError.message,
      );
    } else {
      console.log('✅ org_outreach_timeseries view exists');
      console.log('Sample data:', timeseriesData);
    }

    // Test 3: Check base tables
    console.log('\n3. Testing base tables...');

    const { data: incidentsData, error: incidentsError } = await supabase
      .from('incidents')
      .select('count')
      .limit(1);

    if (incidentsError) {
      console.log('❌ incidents table error:', incidentsError.message);
    } else {
      console.log('✅ incidents table exists');
    }

    const { data: outreachData, error: outreachError } = await supabase
      .from('outreach_logs')
      .select('count')
      .limit(1);

    if (outreachError) {
      console.log('❌ outreach_logs table error:', outreachError.message);
    } else {
      console.log('✅ outreach_logs table exists');
    }

    // Test 4: Test the dashboard function
    console.log('\n4. Testing get_dashboard_data function...');
    const { data: functionData, error: functionError } = await supabase.rpc(
      'get_dashboard_data',
      { org_id: 'anonymous' },
    );

    if (functionError) {
      console.log(
        '❌ get_dashboard_data function error:',
        functionError.message,
      );
    } else {
      console.log('✅ get_dashboard_data function works');
      console.log('Function result:', functionData);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }
}

testDatabaseSchema();
