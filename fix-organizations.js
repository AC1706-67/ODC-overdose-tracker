const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrganizations() {
  try {
    console.log('1. Checking for any organizations (including inactive)...');

    // Try to get all organizations without RLS restrictions using a service role approach
    // First, let's see if we can find any organizations at all
    const { data: allOrgs, error: allError } = await supabase
      .from('organizations')
      .select('*');

    console.log('Query result:', { data: allOrgs, error: allError });

    if (allOrgs && allOrgs.length > 0) {
      console.log('Found organizations:', allOrgs);

      // If there are inactive organizations, let's try to activate one
      const inactiveOrgs = allOrgs.filter((org) => !org.is_active);
      if (inactiveOrgs.length > 0) {
        console.log(
          'Found inactive organizations, trying to activate the first one...',
        );
        const { data: updatedOrg, error: updateError } = await supabase
          .from('organizations')
          .update({ is_active: true })
          .eq('id', inactiveOrgs[0].id)
          .select()
          .single();

        if (updateError) {
          console.error('Error activating organization:', updateError);
        } else {
          console.log('Successfully activated organization:', updatedOrg);
        }
      }
    } else {
      console.log('No organizations found. This might be an RLS issue.');
      console.log(
        'You may need to create an organization through the Supabase dashboard or with service role credentials.',
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixOrganizations();
