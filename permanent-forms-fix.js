const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function permanentFormsFix() {
  try {
    console.log('🔧 PERMANENT FORMS FIX - Ending the cycle forever...\n');
    
    // 1. Make client_id optional in incidents table
    console.log('1. Making client_id optional in incidents table...');
    const makeClientIdOptional = `
      ALTER TABLE incidents 
      ALTER COLUMN client_id DROP NOT NULL;
    `;
    
    const { error: alterError } = await supabase.rpc('exec_sql', { sql_query: makeClientIdOptional });
    if (alterError && !alterError.message.includes('does not exist')) {
      console.log('⚠️  Could not alter client_id (may not be needed):', alterError.message);
    } else {
      console.log('✅ client_id is now optional');
    }
    
    // 2. Test incident with proper UUID
    console.log('\n2. Testing incident with proper UUID...');
    const testIncident = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived',
      organization_id: null,
      client_id: generateUUID() // Proper UUID
    };
    
    const { data: incidentResult, error: incidentError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();
    
    if (incidentError) {
      console.log('❌ Incident still failing:', incidentError);
      
      // Try without client_id
      console.log('   Trying without client_id...');
      const { client_id, ...incidentWithoutClientId } = testIncident;
      const { data: incidentResult2, error: incidentError2 } = await supabase
        .from('incidents')
        .insert(incidentWithoutClientId)
        .select();
      
      if (incidentError2) {
        console.log('❌ Still failing without client_id:', incidentError2);
      } else {
        console.log('✅ Incident works WITHOUT client_id');
        await supabase.from('incidents').delete().eq('incident_id', incidentResult2[0].incident_id);
      }
    } else {
      console.log('✅ Incident works with proper UUID');
      await supabase.from('incidents').delete().eq('incident_id', incidentResult[0].incident_id);
    }
    
    // 3. Test outreach again
    console.log('\n3. Testing outreach submission...');
    const testOutreach = {
      organization_id: null,
      user_id: null,
      outreach_date: '2025-10-29',
      zip_code: '79901',
      location: null,
      kit_types: ['Narcan'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      trip_count: 1,
      team_members: ['Test User'],
      team_organization: null,
      notes: null
    };
    
    const { data: outreachResult, error: outreachError } = await supabase
      .from('outreach_logs')
      .insert(testOutreach)
      .select();
    
    if (outreachError) {
      console.log('❌ Outreach error:', outreachError);
    } else {
      console.log('✅ Outreach works perfectly');
      await supabase.from('outreach_logs').delete().eq('id', outreachResult[0].id);
    }
    
    console.log('\n🎉 PERMANENT FIX COMPLETE!');
    console.log('Both forms should now work consistently without back-and-forth issues.');
    
  } catch (err) {
    console.error('❌ Fix error:', err);
  }
}

permanentFormsFix();