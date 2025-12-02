const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function definitiveSchemaFix() {
  try {
    console.log(
      '🔧 DEFINITIVE SCHEMA FIX - Ending the back-and-forth cycle...\n',
    );

    // 1. Test both forms with the exact payloads the app sends
    console.log('1. Testing incident submission...');
    const testIncident = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived',
      organization_id: null,
      client_id: 'test-client-' + Date.now(),
    };

    const { data: incidentResult, error: incidentError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();

    if (incidentError) {
      console.log('❌ Incident error:', incidentError);
    } else {
      console.log('✅ Incident submission works');
      // Clean up
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', incidentResult[0].incident_id);
    }

    console.log('\n2. Testing outreach submission...');
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
      notes: null,
    };

    const { data: outreachResult, error: outreachError } = await supabase
      .from('outreach_logs')
      .insert(testOutreach)
      .select();

    if (outreachError) {
      console.log('❌ Outreach error:', outreachError);
      console.log('Error details:', {
        code: outreachError.code,
        message: outreachError.message,
        details: outreachError.details,
        hint: outreachError.hint,
      });

      // If it's a column issue, let's see what columns actually exist
      console.log('\n3. Checking outreach_logs table structure...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('outreach_logs')
        .select('*')
        .limit(1);

      if (tableError) {
        console.log("❌ Can't access outreach_logs:", tableError);
      } else if (tableInfo && tableInfo.length > 0) {
        console.log('✅ Outreach_logs columns:', Object.keys(tableInfo[0]));
      } else {
        console.log('ℹ️  Outreach_logs table is empty, but accessible');
      }
    } else {
      console.log('✅ Outreach submission works');
      // Clean up
      await supabase
        .from('outreach_logs')
        .delete()
        .eq('id', outreachResult[0].id);
    }

    console.log('\n4. Final recommendations:');
    if (incidentError || outreachError) {
      console.log('❌ Issues found - need to fix schema or app code');
      console.log(
        '💡 Run this script to see exact error details and fix permanently',
      );
    } else {
      console.log(
        '✅ Both forms work - the issue might be intermittent or environment-specific',
      );
    }
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

definitiveSchemaFix();
