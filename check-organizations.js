const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrganizations() {
  try {
    console.log('Checking all organizations...');
    const { data: allOrgs, error: allError } = await supabase
      .from('organizations')
      .select('*');

    if (allError) {
      console.error('Error fetching all organizations:', allError);
      return;
    }

    console.log('All organizations:', allOrgs);

    if (allOrgs.length === 0) {
      console.log(
        'No organizations found at all. Creating a test organization...',
      );

      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          slug: 'test-org',
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating organization:', createError);
      } else {
        console.log('Created test organization:', newOrg);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkOrganizations();
