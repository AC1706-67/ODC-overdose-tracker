require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testZipCodeConstraint() {
  try {
    console.log('Testing ZIP code constraint...');

    // Test inserting with "NA"
    console.log('Testing "NA" value...');
    const { data: naData, error: naError } = await supabase
      .from('incidents')
      .insert({
        zip_code: 'NA',
        gender: 'Unknown',
        approx_age: 'Unknown',
        narcan_used: false,
        survival: 'Unknown',
        client_id: '00000000-0000-0000-0000-000000000001',
      })
      .select();

    if (naError) {
      console.log('❌ "NA" value rejected:', naError.message);
    } else {
      console.log('✅ "NA" value accepted');
      // Clean up test record
      await supabase
        .from('incidents')
        .delete()
        .eq('client_id', '00000000-0000-0000-0000-000000000001');
    }

    // Test inserting with "Unknown"
    console.log('Testing "Unknown" value...');
    const { data: unknownData, error: unknownError } = await supabase
      .from('incidents')
      .insert({
        zip_code: 'Unknown',
        gender: 'Unknown',
        approx_age: 'Unknown',
        narcan_used: false,
        survival: 'Unknown',
        client_id: '00000000-0000-0000-0000-000000000002',
      })
      .select();

    if (unknownError) {
      console.log('❌ "Unknown" value rejected:', unknownError.message);
    } else {
      console.log('✅ "Unknown" value accepted');
      // Clean up test record
      await supabase
        .from('incidents')
        .delete()
        .eq('client_id', '00000000-0000-0000-0000-000000000002');
    }

    // Test normal ZIP code
    console.log('Testing normal ZIP code...');
    const { data: normalData, error: normalError } = await supabase
      .from('incidents')
      .insert({
        zip_code: '12345',
        gender: 'Unknown',
        approx_age: 'Unknown',
        narcan_used: false,
        survival: 'Unknown',
        client_id: '00000000-0000-0000-0000-000000000003',
      })
      .select();

    if (normalError) {
      console.log('❌ Normal ZIP code rejected:', normalError.message);
    } else {
      console.log('✅ Normal ZIP code accepted');
      // Clean up test record
      await supabase
        .from('incidents')
        .delete()
        .eq('client_id', '00000000-0000-0000-0000-000000000003');
    }
  } catch (error) {
    console.error('Error testing constraint:', error);
  }
}

testZipCodeConstraint();
