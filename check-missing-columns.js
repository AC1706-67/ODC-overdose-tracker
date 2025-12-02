#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const config = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://vitwypicporqpeefwsjs.supabase.co',
  supabaseKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI',
};

async function checkMissingColumns() {
  console.log(
    '🔍 Checking for missing columns that should have been added...\n',
  );

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Check if role_in_activity was added to outreach_team_members
  console.log('📋 OUTREACH_TEAM_MEMBERS TABLE:');
  console.log('===============================');

  const { error: roleError } = await supabase
    .from('outreach_team_members')
    .select('role_in_activity')
    .limit(1);

  if (roleError) {
    console.log('❌ role_in_activity column missing:', roleError.message);
  } else {
    console.log('✅ role_in_activity column exists');
  }

  // Check if location_type was added to locations
  console.log('\n📋 LOCATIONS TABLE:');
  console.log('===================');

  const { error: locationTypeError } = await supabase
    .from('locations')
    .select('location_type')
    .limit(1);

  if (locationTypeError) {
    console.log('❌ location_type column missing:', locationTypeError.message);
  } else {
    console.log('✅ location_type column exists');
  }

  // Test a simple insert to see if it works
  console.log('\n🧪 TESTING FUNCTIONALITY:');
  console.log('=========================');

  // Test team member creation
  try {
    const { data: testOrg, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (testOrg) {
      const { data: testMember, error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            name: 'Test Member',
            organization_id: testOrg.id,
            is_active: true,
          },
        ])
        .select('*')
        .single();

      if (memberError) {
        console.log('❌ Team member creation failed:', memberError.message);
      } else {
        console.log('✅ Team member creation works');

        // Clean up
        await supabase.from('team_members').delete().eq('id', testMember.id);
      }
    }
  } catch (error) {
    console.log('❌ Team member test failed:', error.message);
  }

  // Test location creation
  try {
    const { data: testLocation, error: locationError } = await supabase
      .from('locations')
      .insert([
        {
          name: 'Test Location',
          kind: 'area',
          is_active: true,
        },
      ])
      .select('*')
      .single();

    if (locationError) {
      console.log('❌ Location creation failed:', locationError.message);
    } else {
      console.log('✅ Location creation works');

      // Clean up
      await supabase.from('locations').delete().eq('id', testLocation.id);
    }
  } catch (error) {
    console.log('❌ Location test failed:', error.message);
  }

  // Check analytics views structure
  console.log('\n📊 ANALYTICS VIEWS STRUCTURE:');
  console.log('=============================');

  const views = [
    'team_member_stats_v1',
    'location_analytics_v1',
    'activity_timeline_v1',
  ];

  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select('*').limit(1);

      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
      } else {
        console.log(`✅ ${view}: Working`);
        if (data && data.length > 0) {
          console.log(`   Sample fields: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${view}: ${error.message}`);
    }
  }
}

checkMissingColumns().catch(console.error);
