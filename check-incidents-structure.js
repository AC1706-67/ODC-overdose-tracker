const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncidentsStructure() {
  try {
    console.log('🔍 Checking incidents table structure...\n');
    
    // Try to get sample data to see what columns exist
    console.log('1. Checking what data exists in incidents table...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
    
    if (incidentsError) {
      console.log('❌ Error accessing incidents:', incidentsError);
    } else if (incidents && incidents.length > 0) {
      console.log('✅ Sample incident record:');
      console.log('Columns found:', Object.keys(incidents[0]));
      console.log('Sample data:', JSON.stringify(incidents[0], null, 2));
    } else {
      console.log('ℹ️  No data in incidents table, but table exists');
    }
    
    // Try to insert a test record to see what columns are expected
    console.log('\n2. Testing incident insertion to see required columns...');
    const testIncident = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived', // This might be wrong - could be 'outcome'
      organization_id: null
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();
    
    if (insertError) {
      console.log('❌ Insert error (shows us what columns are wrong):', insertError);
      
      // Try with 'outcome' instead of 'survival'
      console.log('\n3. Trying with "outcome" instead of "survival"...');
      const testIncident2 = {
        zip_code: '79901',
        gender: 'Male',
        approx_age: '26-35',
        narcan_used: true,
        outcome: 'Survived', // Changed from 'survival' to 'outcome'
        organization_id: null
      };
      
      const { data: insertTest2, error: insertError2 } = await supabase
        .from('incidents')
        .insert(testIncident2)
        .select();
      
      if (insertError2) {
        console.log('❌ Still error with outcome:', insertError2);
      } else {
        console.log('✅ Success with "outcome" column!');
        console.log('Inserted record:', insertTest2[0]);
        
        // Clean up test record
        await supabase
          .from('incidents')
          .delete()
          .eq('incident_id', insertTest2[0].incident_id);
        console.log('🧹 Test record cleaned up');
      }
    } else {
      console.log('✅ Insert successful with "survival" column');
      console.log('Inserted record:', insertTest[0]);
      
      // Clean up test record
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', insertTest[0].incident_id);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Error checking structure:', err);
  }
}

checkIncidentsStructure();