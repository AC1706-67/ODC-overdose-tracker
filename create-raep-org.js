const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function createRAEP() {
  try {
    console.log('Creating Recovery Alliance of El Paso organization...\n');
    
    // Use the canonical ID from the feature access code
    const CANON_RAEP_ID = '6e892800-0429-442f-bff8-417b4d4ec793';
    
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        id: CANON_RAEP_ID,
        slug: 'raep',
        name: 'Recovery Alliance of El Paso',
        is_active: true
      })
      .select();
    
    if (error) {
      if (error.code === '23505') {
        console.log('✓ Organization already exists');
      } else {
        console.error('Error:', error);
      }
    } else {
      console.log('✓ Organization created successfully!');
      console.log(data[0]);
    }

    // Verify it exists
    console.log('\n=== All Organizations ===');
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('*');
    
    console.table(allOrgs);

  } catch (error) {
    console.error('Error:', error);
  }
}

createRAEP();
