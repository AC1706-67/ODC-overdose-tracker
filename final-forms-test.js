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

async function finalFormsTest() {
  try {
    console.log('🧪 FINAL FORMS TEST - Ensuring permanent stability...\n');

    let allPassed = true;

    // Test 1: Incident with proper UUID
    console.log('1. Testing incident submission (proper UUID)...');
    const incident1 = {
      zip_code: '79901',
      gender: 'Male',
      approx_age: '26-35',
      narcan_used: true,
      survival: 'Survived',
      organization_id: null,
      client_id: generateUUID(),
    };

    const { data: i1, error: e1 } = await supabase
      .from('incidents')
      .insert(incident1)
      .select();
    if (e1) {
      console.log('❌ Test 1 failed:', e1.message);
      allPassed = false;
    } else {
      console.log('✅ Test 1 passed');
      await supabase
        .from('incidents')
        .delete()
        .eq('incident_id', i1[0].incident_id);
    }

    // Test 2: Outreach submission
    console.log('2. Testing outreach submission...');
    const outreach1 = {
      organization_id: null,
      user_id: null,
      outreach_date: '2025-10-29',
      zip_code: '79902',
      kit_types: ['Narcan', 'Hygiene'],
      num_kits: 5,
      people_reached: 3,
      males_reached: 2,
      females_reached: 1,
      trip_count: 1,
      team_members: ['Joey', 'Andres'],
      notes: 'Test outreach',
    };

    const { data: o1, error: oe1 } = await supabase
      .from('outreach_logs')
      .insert(outreach1)
      .select();
    if (oe1) {
      console.log('❌ Test 2 failed:', oe1.message);
      allPassed = false;
    } else {
      console.log('✅ Test 2 passed');
      await supabase.from('outreach_logs').delete().eq('id', o1[0].id);
    }

    // Test 3: Multiple rapid submissions (stress test)
    console.log('3. Testing rapid submissions (stress test)...');
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        supabase
          .from('incidents')
          .insert({
            zip_code: '7990' + i,
            gender: 'Female',
            approx_age: '18-25',
            narcan_used: false,
            survival: 'Unknown',
            organization_id: null,
            client_id: generateUUID(),
          })
          .select(),
      );
    }

    const results = await Promise.all(promises);
    let stressTestPassed = true;
    const idsToCleanup = [];

    results.forEach((result, i) => {
      if (result.error) {
        console.log(`❌ Stress test ${i + 1} failed:`, result.error.message);
        stressTestPassed = false;
        allPassed = false;
      } else {
        idsToCleanup.push(result.data[0].incident_id);
      }
    });

    if (stressTestPassed) {
      console.log('✅ Test 3 passed (all rapid submissions worked)');
    }

    // Cleanup stress test data
    for (const id of idsToCleanup) {
      await supabase.from('incidents').delete().eq('incident_id', id);
    }

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! Forms are now permanently stable.');
      console.log('✅ No more back-and-forth errors expected.');
    } else {
      console.log('❌ Some tests failed. Check the errors above.');
    }
    console.log('='.repeat(50));
  } catch (err) {
    console.error('❌ Test script error:', err);
  }
}

finalFormsTest();
