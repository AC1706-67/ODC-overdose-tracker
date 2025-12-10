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

async function applyBlockchainFoundation() {
  console.log('🔗 Setting up Blockchain Foundation...\n');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Read the blockchain migration SQL file
  const sqlContent = fs.readFileSync('supabase/migrations/20251209_add_blockchain_foundation.sql', 'utf8');

  console.log('📋 Blockchain Foundation SQL:');
  console.log('=============================');
  console.log(sqlContent);
  console.log('\n⚠️  NOTE: This SQL needs to be applied manually in the Supabase SQL Editor');
  console.log("   The Supabase client doesn't support DDL operations via the API.\n");

  console.log('📝 MANUAL STEPS:');
  console.log('================');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL from supabase/migrations/20251209_add_blockchain_foundation.sql');
  console.log('4. Run the SQL');
  console.log('5. Come back and run: node apply-blockchain-foundation.js --verify');
  console.log('6. Test blockchain settings in your app\n');

  // If --verify flag is passed, test the blockchain foundation
  if (process.argv.includes('--verify')) {
    console.log('🧪 Verifying blockchain foundation setup...\n');
    
    try {
      // Test blockchain columns on incidents
      const { data: incidentCols, error: incidentError } = await supabase
        .from('incidents')
        .select('blockchain_hash, blockchain_timestamp, blockchain_network, blockchain_verified')
        .limit(1);

      if (incidentError) {
        console.log('❌ incidents blockchain columns missing:', incidentError.message);
      } else {
        console.log('✅ incidents blockchain columns exist');
      }

      // Test blockchain columns on outreach_logs
      const { data: outreachCols, error: outreachError } = await supabase
        .from('outreach_logs')
        .select('blockchain_hash, blockchain_timestamp, blockchain_network, blockchain_verified')
        .limit(1);

      if (outreachError) {
        console.log('❌ outreach_logs blockchain columns missing:', outreachError.message);
      } else {
        console.log('✅ outreach_logs blockchain columns exist');
      }

      // Test blockchain_records table
      const { data: recordsData, error: recordsError } = await supabase
        .from('blockchain_records')
        .select('*')
        .limit(1);

      if (recordsError) {
        console.log('❌ blockchain_records table missing:', recordsError.message);
      } else {
        console.log('✅ blockchain_records table exists');
      }

      // Test blockchain_config table
      const { data: configData, error: configError } = await supabase
        .from('blockchain_config')
        .select('*')
        .limit(1);

      if (configError) {
        console.log('❌ blockchain_config table missing:', configError.message);
      } else {
        console.log('✅ blockchain_config table exists');
      }

      // Test blockchain_analytics view
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('blockchain_analytics')
        .select('*')
        .limit(1);

      if (analyticsError) {
        console.log('❌ blockchain_analytics view missing:', analyticsError.message);
      } else {
        console.log('✅ blockchain_analytics view exists');
      }

      console.log('\n🎯 BLOCKCHAIN FOUNDATION STATUS:');
      console.log('================================');
      
      const allGood = !incidentError && !outreachError && !recordsError && !configError && !analyticsError;
      
      if (allGood) {
        console.log('✅ Blockchain foundation is fully set up!');
        console.log('✅ Your app is now blockchain-ready');
        console.log('✅ Data will be collected with blockchain hashes');
        console.log('✅ Organizations can configure blockchain settings');
        console.log('\n🚀 NEXT STEPS:');
        console.log('==============');
        console.log('1. Build and test your app with blockchain foundation');
        console.log('2. Organizations can now see blockchain settings (preview mode)');
        console.log('3. When ready, implement actual blockchain submission in Phase 2');
        console.log('4. See BLOCKCHAIN-INTEGRATION-PLAN.md for full roadmap');
      } else {
        console.log('❌ Some blockchain components are missing');
        console.log('❌ Please apply the SQL migration first');
      }

    } catch (error) {
      console.log('❌ Error verifying blockchain foundation:', error.message);
    }
  }

  console.log('\n📚 DOCUMENTATION:');
  console.log('==================');
  console.log('• BLOCKCHAIN-INTEGRATION-PLAN.md - Full implementation plan');
  console.log('• src/services/blockchain.ts - Service layer interface');
  console.log('• components/BlockchainSettings.tsx - Admin UI component');
  console.log('• supabase/migrations/20251209_add_blockchain_foundation.sql - Database schema');

  return true;
}

if (require.main === module) {
  applyBlockchainFoundation()
    .then(() => {
      console.log('\n✅ Blockchain foundation setup instructions provided');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { applyBlockchainFoundation };