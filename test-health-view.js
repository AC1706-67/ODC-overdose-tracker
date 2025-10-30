const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHealthView() {
  try {
    console.log('🔍 Testing health dashboard view...\n');
    
    // 1. Check if incidents exist
    console.log('1. Checking incidents table...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .limit(5);
    
    if (incidentsError) {
      console.log('❌ Error accessing incidents:', incidentsError);
    } else {
      console.log(`✅ Found ${incidents.length} incidents:`);
      incidents.forEach((incident, i) => {
        console.log(`  ${i+1}. ${incident.zip_code} - ${incident.gender} - ${incident.survival} - Narcan: ${incident.narcan_used} - Created: ${incident.created_at}`);
      });
    }
    
    // 2. Test the view directly
    console.log('\n2. Testing health_dashboard_v1 view...');
    const { data: viewData, error: viewError } = await supabase
      .from('health_dashboard_v1')
      .select('*');
    
    if (viewError) {
      console.log('❌ Error accessing view:', viewError);
    } else {
      console.log(`✅ View returned ${viewData.length} rows:`);
      viewData.forEach((row, i) => {
        console.log(`  ${i+1}. Org: ${row.organization_id || 'null'} - Incidents: ${row.incidents_30d} - Narcan: ${row.with_narcan_30d} - Survived: ${row.survived_30d}`);
      });
    }
    
    // 3. Test querying for null organization_id specifically
    console.log('\n3. Testing query for null organization_id...');
    const { data: nullOrgData, error: nullOrgError } = await supabase
      .from('health_dashboard_v1')
      .select('*')
      .is('organization_id', null);
    
    if (nullOrgError) {
      console.log('❌ Error querying null org:', nullOrgError);
    } else {
      console.log(`✅ Null org query returned ${nullOrgData.length} rows:`);
      nullOrgData.forEach((row, i) => {
        console.log(`  ${i+1}. Incidents: ${row.incidents_30d} - Narcan: ${row.with_narcan_30d} - Survived: ${row.survived_30d} - Deceased: ${row.deceased_30d}`);
      });
    }
    
    // 4. Test .single() vs regular query
    console.log('\n4. Testing .single() query...');
    const { data: singleData, error: singleError } = await supabase
      .from('health_dashboard_v1')
      .select('*')
      .is('organization_id', null)
      .single();
    
    if (singleError) {
      console.log('❌ Single query error:', singleError);
      console.log('Error code:', singleError.code);
    } else {
      console.log('✅ Single query successful:', singleData);
    }
    
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

testHealthView();