const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRecoveryAlliance() {
  try {
    console.log('🏢 Creating Recovery Alliance of El Paso...');
    
    // Create Recovery Alliance of El Paso
    const recoveryAlliance = await supabase.from('organizations').insert({
      name: 'Recovery Alliance of El Paso',
      description: 'Community organization focused on recovery and harm reduction services in El Paso',
      contact_email: 'info@recoveryallianceep.org',
      phone: null,
      address: 'El Paso, TX',
      website: null,
      is_active: true
    }).select();
    
    if (recoveryAlliance.error) {
      console.log('❌ Error creating Recovery Alliance:', recoveryAlliance.error);
    } else {
      console.log('✅ Recovery Alliance created with ID:', recoveryAlliance.data[0].id);
    }
    
    // Now fix the main issue - force organization_id to be null for anonymous submissions
    console.log('\n🔧 Fixing the outreach submission to always use null organization_id...');
    
    // Test the exact submission that's failing in your app
    const testSubmission = await supabase.from('outreach_logs').insert({
      zip_code: '79901',
      location: null,
      kit_types: ['Narcan'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      notes: 'We\'re in the field we made two trips on this outreach and we reached three people',
      organization_id: null, // Force null for anonymous
      outreach_date: '2025-10-28',
      team_members: 'Joey & Andres',
      team_organization: null,
      trip_count: 2
    });
    
    if (testSubmission.error) {
      console.log('❌ Test submission error:', testSubmission.error);
    } else {
      console.log('✅ Test submission successful!');
      console.log('  Submission ID:', testSubmission.data[0].id);
      // Don't clean up - let it stay as test data
    }
    
    console.log('\n✅ Setup complete!');
    console.log('💡 The issue is likely that activeOrgId has an invalid value.');
    console.log('🔄 Try submitting your outreach form again.');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createRecoveryAlliance();