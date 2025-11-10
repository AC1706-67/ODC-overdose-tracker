require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkHealthViewDefinition() {
  console.log('=== Checking health_dashboard_v1 View Definition ===\n');

  // Get the view definition
  const { data, error } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT pg_get_viewdef('health_dashboard_v1'::regclass, true) as definition;
      `
    });

  if (error) {
    console.log('Cannot get view definition directly, trying alternative...\n');
    
    // Alternative: check information_schema
    const { data: viewInfo, error: viewError } = await supabase
      .from('information_schema.views')
      .select('*')
      .eq('table_name', 'health_dashboard_v1');
    
    if (viewError) {
      console.log('❌ Error:', viewError.message);
    } else {
      console.log('View info:', JSON.stringify(viewInfo, null, 2));
    }
  } else {
    console.log('View definition:', data);
  }

  // Check what data exists in the view
  console.log('\n=== Checking View Data ===\n');
  const { data: viewData, error: viewDataError } = await supabase
    .from('health_dashboard_v1')
    .select('*');
  
  if (viewDataError) {
    console.log('❌ Error:', viewDataError.message);
  } else {
    console.log('View data:', JSON.stringify(viewData, null, 2));
  }

  // Check incidents by organization
  console.log('\n=== Checking Incidents by Organization ===\n');
  const { data: incidentsByOrg, error: incError } = await supabase
    .from('incidents')
    .select('organization_id')
    .not('organization_id', 'is', null);
  
  if (incError) {
    console.log('❌ Error:', incError.message);
  } else {
    const orgCounts = {};
    incidentsByOrg.forEach(inc => {
      orgCounts[inc.organization_id] = (orgCounts[inc.organization_id] || 0) + 1;
    });
    console.log('Incidents by org:', orgCounts);
  }

  // Check all incidents
  console.log('\n=== All Incidents Organization IDs ===\n');
  const { data: allInc, error: allIncError } = await supabase
    .from('incidents')
    .select('organization_id, incident_id');
  
  if (allIncError) {
    console.log('❌ Error:', allIncError.message);
  } else {
    console.log(`Total incidents: ${allInc.length}`);
    const nullCount = allInc.filter(i => i.organization_id === null).length;
    const withOrgCount = allInc.filter(i => i.organization_id !== null).length;
    console.log(`- With null org_id: ${nullCount}`);
    console.log(`- With org_id: ${withOrgCount}`);
  }
}

checkHealthViewDefinition().catch(console.error);
