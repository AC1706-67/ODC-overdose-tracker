const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrganizations() {
  try {
    console.log('🏢 Creating the two organizations...');

    // Create Recovery Alliance of El Paso
    console.log('\n1. Creating Recovery Alliance of El Paso...');
    const recoveryAlliance = await supabase
      .from('organizations')
      .insert({
        name: 'Recovery Alliance of El Paso',
        description:
          'Community organization focused on recovery and harm reduction services in El Paso',
        contact_email: 'info@recoveryallianceep.org',
        phone: null,
        address: 'El Paso, TX',
        website: null,
        is_active: true,
      })
      .select();

    if (recoveryAlliance.error) {
      console.log(
        '❌ Error creating Recovery Alliance:',
        recoveryAlliance.error,
      );
    } else {
      console.log('✅ Recovery Alliance created:', recoveryAlliance.data[0].id);
    }

    // Create Community Health Network
    console.log('\n2. Creating Community Health Network...');
    const healthNetwork = await supabase
      .from('organizations')
      .insert({
        name: 'Community Health Network',
        description:
          'Healthcare network providing community health services and outreach',
        contact_email: 'contact@communityhealthnetwork.org',
        phone: null,
        address: 'El Paso, TX',
        website: null,
        is_active: true,
      })
      .select();

    if (healthNetwork.error) {
      console.log(
        '❌ Error creating Community Health Network:',
        healthNetwork.error,
      );
    } else {
      console.log(
        '✅ Community Health Network created:',
        healthNetwork.data[0].id,
      );
    }

    // List all organizations
    console.log('\n3. Listing all organizations...');
    const { data: allOrgs, error: listError } = await supabase
      .from('organizations')
      .select('*');

    if (listError) {
      console.log('❌ Error listing organizations:', listError);
    } else {
      console.log(`Found ${allOrgs.length} organizations:`);
      allOrgs.forEach((org) => {
        console.log(`  - ${org.name} (ID: ${org.id})`);
      });
    }

    // Test outreach submission with null organization_id (anonymous)
    console.log('\n4. Testing anonymous outreach submission...');
    const testSubmission = await supabase.from('outreach_logs').insert({
      zip_code: '79901',
      location: 'Downtown El Paso',
      kit_types: ['Narcan'],
      num_kits: 5,
      people_reached: 3,
      males_reached: 2,
      females_reached: 1,
      notes: 'Test submission from app',
      organization_id: null, // Anonymous submission
      outreach_date: '2025-10-28',
      team_members: 'Joey & Andres',
      team_organization: 'Recovery Alliance of El Paso',
      trip_count: 2,
    });

    if (testSubmission.error) {
      console.log('❌ Test submission error:', testSubmission.error);
    } else {
      console.log('✅ Test submission successful!');
      // Clean up test record
      if (testSubmission.data && testSubmission.data[0]) {
        await supabase
          .from('outreach_logs')
          .delete()
          .eq('id', testSubmission.data[0].id);
        console.log('  Test record cleaned up');
      }
    }

    console.log('\n✅ Organizations created successfully!');
    console.log('🔄 Your app should now work with proper organization data.');
  } catch (err) {
    console.error('❌ Error creating organizations:', err);
  }
}

createOrganizations();
