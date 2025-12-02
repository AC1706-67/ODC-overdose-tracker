#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://vitwypicporqpeefwsjs.supabase.co',
  supabaseKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI',
};

async function applySchemaUpdates() {
  console.log('🔧 Applying schema updates to Supabase...\n');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Read the SQL file
  const sqlContent = fs.readFileSync('supabase-schema-updates.sql', 'utf8');

  console.log('📋 SQL to be applied:');
  console.log('====================');
  console.log(sqlContent);
  console.log(
    '\n⚠️  NOTE: These updates need to be applied manually in the Supabase SQL Editor',
  );
  console.log(
    "   The Supabase client doesn't support DDL operations via the API.\n",
  );

  console.log('📝 MANUAL STEPS:');
  console.log('================');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL from supabase-schema-updates.sql');
  console.log('4. Run the SQL');
  console.log('5. Come back and run: node analyze-database-schema.js');
  console.log('6. Verify all issues are resolved\n');

  // Test current state
  console.log('🧪 Testing current schema state...');

  try {
    // Test team_members role column
    const { error: roleError } = await supabase
      .from('team_members')
      .select('role')
      .limit(1);

    if (roleError) {
      console.log('❌ team_members.role column missing');
    } else {
      console.log('✅ team_members.role column exists');
    }

    // Test locations columns
    const { error: locError } = await supabase
      .from('locations')
      .select('normalized_name, line1, is_active')
      .limit(1);

    if (locError) {
      console.log('❌ locations missing columns:', locError.message);
    } else {
      console.log('✅ locations columns exist');
    }

    // Test views
    const { error: viewError } = await supabase
      .from('team_member_stats_v1')
      .select('*')
      .limit(1);

    if (viewError) {
      console.log('❌ analytics views issue:', viewError.message);
    } else {
      console.log('✅ analytics views working');
    }
  } catch (error) {
    console.log('❌ Error testing schema:', error.message);
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('==============');
  console.log('After applying the SQL updates manually:');
  console.log('1. Run: node analyze-database-schema.js (should show 0 issues)');
  console.log(
    '2. Run: node __tests__/enhanced-outreach-analytics.test.js (should test full DB operations)',
  );
  console.log('3. Test the enhanced outreach analytics features in your app');

  return true;
}

if (require.main === module) {
  applySchemaUpdates()
    .then(() => {
      console.log('\n✅ Schema update instructions provided');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { applySchemaUpdates };
