const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIncidentInsert() {
  try {
    console.log(
      '🧪 Testing incident insertion to find missing required fields...\n',
    );

    // Test 1: Basic incident data (what the app is sending)
    console.log('1. Testing basic incident data...');
    const basicIncident = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived',
      organization_id: null,
    };

    const { data: test1, error: error1 } = await supabase
      .from('incidents')
      .insert(basicIncident)
      .select();

    if (error1) {
      console.log('❌ Basic insert error:', error1);
      console.log('Error code:', error1.code);
      console.log('Error details:', error1.details);
      console.log('Error hint:', error1.hint);
    } else {
      console.log('✅ Basic insert successful:', test1[0]);
      // Clean up
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', test1[0].incident_id);
    }

    // Test 2: Add user_id field
    console.log('\n2. Testing with user_id field...');
    const withUserId = {
      ...basicIncident,
      user_id: null, // or some UUID
    };

    const { data: test2, error: error2 } = await supabase
      .from('incidents')
      .insert(withUserId)
      .select();

    if (error2) {
      console.log('❌ With user_id error:', error2);
    } else {
      console.log('✅ With user_id successful:', test2[0]);
      // Clean up
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', test2[0].incident_id);
    }

    // Test 3: Add created_at field
    console.log('\n3. Testing with created_at field...');
    const withTimestamp = {
      ...basicIncident,
      user_id: null,
      created_at: new Date().toISOString(),
    };

    const { data: test3, error: error3 } = await supabase
      .from('incidents')
      .insert(withTimestamp)
      .select();

    if (error3) {
      console.log('❌ With created_at error:', error3);
    } else {
      console.log('✅ With created_at successful:', test3[0]);
      // Clean up
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', test3[0].incident_id);
    }
  } catch (err) {
    console.error('❌ Test error:', err);
  }
}

testIncidentInsert();
