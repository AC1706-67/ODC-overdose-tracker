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

async function checkActualColumns() {
  console.log('🔍 Checking actual column names in your database...\n');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Check outreach_logs columns by getting a sample record
  console.log('📋 OUTREACH_LOGS TABLE COLUMNS:');
  console.log('================================');

  const { data: outreachSample, error: outreachError } = await supabase
    .from('outreach_logs')
    .select('*')
    .limit(1);

  if (outreachError) {
    console.log('❌ Error:', outreachError.message);
  } else if (outreachSample && outreachSample.length > 0) {
    const columns = Object.keys(outreachSample[0]);
    columns.forEach((col) => {
      console.log(`✅ ${col}`);
    });
  } else {
    console.log('⚠️ No data in outreach_logs table');
  }

  // Check team_members columns
  console.log('\n📋 TEAM_MEMBERS TABLE COLUMNS:');
  console.log('==============================');

  const { data: teamSample, error: teamError } = await supabase
    .from('team_members')
    .select('*')
    .limit(1);

  if (teamError) {
    console.log('❌ Error:', teamError.message);
  } else if (teamSample && teamSample.length > 0) {
    const columns = Object.keys(teamSample[0]);
    columns.forEach((col) => {
      console.log(`✅ ${col}`);
    });
  } else {
    console.log('⚠️ No data in team_members table');
    // Try to get schema without data
    const { error: schemaError } = await supabase
      .from('team_members')
      .select('*')
      .limit(0);

    if (!schemaError) {
      console.log('✅ Table exists but is empty');
    }
  }

  // Check analytics views
  console.log('\n📊 ANALYTICS VIEWS:');
  console.log('===================');

  const views = [
    'team_member_stats_v1',
    'location_analytics_v1',
    'activity_timeline_v1',
  ];

  for (const view of views) {
    const { data: viewSample, error: viewError } = await supabase
      .from(view)
      .select('*')
      .limit(1);

    console.log(`\n🔍 ${view}:`);
    if (viewError) {
      console.log(`❌ Error: ${viewError.message}`);
    } else if (viewSample && viewSample.length > 0) {
      const columns = Object.keys(viewSample[0]);
      columns.forEach((col) => {
        console.log(`  ✅ ${col}`);
      });
    } else {
      console.log('  ⚠️ View exists but no data');
    }
  }

  // Test specific problematic columns
  console.log('\n🔍 TESTING SPECIFIC COLUMNS:');
  console.log('============================');

  // Test outreach_date vs occurred_at
  console.log('\n📅 Date column test:');
  const { error: dateError1 } = await supabase
    .from('outreach_logs')
    .select('outreach_date')
    .limit(1);

  const { error: dateError2 } = await supabase
    .from('outreach_logs')
    .select('occurred_at')
    .limit(1);

  if (!dateError1) {
    console.log('✅ outreach_date column exists');
  } else {
    console.log('❌ outreach_date column missing:', dateError1.message);
  }

  if (!dateError2) {
    console.log('✅ occurred_at column exists');
  } else {
    console.log('❌ occurred_at column missing:', dateError2.message);
  }

  // Test people_reached
  console.log('\n👥 People reached test:');
  const { error: peopleError } = await supabase
    .from('outreach_logs')
    .select('people_reached')
    .limit(1);

  if (!peopleError) {
    console.log('✅ people_reached column exists');
  } else {
    console.log('❌ people_reached column missing:', peopleError.message);
  }
}

checkActualColumns().catch(console.error);
