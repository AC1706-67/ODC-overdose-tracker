require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function debugHealthIncidents() {
  console.log('=== Debugging Health Incidents ===\n');

  // Check if health_dashboard_v1 view exists
  console.log('1. Checking health_dashboard_v1 view...');
  const { data: viewData, error: viewError } = await supabase
    .from('health_dashboard_v1')
    .select('*')
    .limit(5);

  if (viewError) {
    console.log('❌ View error:', viewError.message);
  } else {
    console.log('✅ View data:', JSON.stringify(viewData, null, 2));
  }

  // Check incidents table directly
  console.log('\n2. Checking incidents table...');
  const { data: incidents, error: incError } = await supabase
    .from('incidents')
    .select('*')
    .limit(5);

  if (incError) {
    console.log('❌ Incidents error:', incError.message);
  } else {
    console.log(`✅ Found ${incidents?.length || 0} incidents`);
    if (incidents && incidents.length > 0) {
      console.log('Sample incident:', JSON.stringify(incidents[0], null, 2));
    }
  }

  // Count total incidents
  console.log('\n3. Counting total incidents...');
  const { count, error: countError } = await supabase
    .from('incidents')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Count error:', countError.message);
  } else {
    console.log(`✅ Total incidents: ${count}`);
  }

  // Check incidents from last 30 days
  console.log('\n4. Checking incidents from last 30 days...');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentIncidents, error: recentError } = await supabase
    .from('incidents')
    .select('*')
    .gte('incident_date', thirtyDaysAgo.toISOString())
    .limit(10);

  if (recentError) {
    console.log('❌ Recent incidents error:', recentError.message);
  } else {
    console.log(
      `✅ Found ${recentIncidents?.length || 0} incidents in last 30 days`,
    );
    if (recentIncidents && recentIncidents.length > 0) {
      console.log(
        'Sample recent incident:',
        JSON.stringify(recentIncidents[0], null, 2),
      );
    }
  }

  // Check table structure
  console.log('\n5. Checking incidents table structure...');
  const { data: structure, error: structError } = await supabase
    .from('incidents')
    .select('*')
    .limit(1);

  if (!structError && structure && structure.length > 0) {
    console.log('Table columns:', Object.keys(structure[0]));
  }
}

debugHealthIncidents().catch(console.error);
