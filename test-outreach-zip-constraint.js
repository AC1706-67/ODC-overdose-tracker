require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOutreachZipConstraint() {
  try {
    console.log('Testing outreach_logs ZIP code constraint...');

    // Test inserting with "NA"
    console.log('Testing "NA" value...');
    const { data: naData, error: naError } = await supabase
      .from('outreach_logs')
      .insert({
        zip_code: 'NA',
        kit_types: ['Narcan'],
        num_kits: 1,
        people_reached: 1,
      })
      .select();

    if (naError) {
      console.log('❌ "NA" value rejected:', naError.message);
    } else {
      console.log('✅ "NA" value accepted');
      // Clean up test record
      await supabase.from('outreach_logs').delete().eq('id', naData[0].id);
    }

    // Test inserting with "Unknown"
    console.log('Testing "Unknown" value...');
    const { data: unknownData, error: unknownError } = await supabase
      .from('outreach_logs')
      .insert({
        zip_code: 'Unknown',
        kit_types: ['Narcan'],
        num_kits: 1,
        people_reached: 1,
      })
      .select();

    if (unknownError) {
      console.log('❌ "Unknown" value rejected:', unknownError.message);
    } else {
      console.log('✅ "Unknown" value accepted');
      // Clean up test record
      await supabase.from('outreach_logs').delete().eq('id', unknownData[0].id);
    }

    // Test normal ZIP code
    console.log('Testing normal ZIP code...');
    const { data: normalData, error: normalError } = await supabase
      .from('outreach_logs')
      .insert({
        zip_code: '12345',
        kit_types: ['Narcan'],
        num_kits: 1,
        people_reached: 1,
      })
      .select();

    if (normalError) {
      console.log('❌ Normal ZIP code rejected:', normalError.message);
    } else {
      console.log('✅ Normal ZIP code accepted');
      // Clean up test record
      await supabase.from('outreach_logs').delete().eq('id', normalData[0].id);
    }
  } catch (error) {
    console.error('Error testing constraint:', error);
  }
}

testOutreachZipConstraint();
