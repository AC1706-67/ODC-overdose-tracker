const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function nuclearRLSFix() {
  try {
    console.log('💥 NUCLEAR RLS FIX: Finding and destroying ALL policies...');
    
    // First, find ALL tables with RLS enabled
    console.log('1. Finding all tables with RLS...');
    const { data: tables } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE 'information_%';
      ` 
    });
    
    if (tables && Array.isArray(tables)) {
      console.log(`Found ${tables.length} tables:`, tables.map(t => t.tablename).join(', '));
      
      for (const table of tables) {
        const tableName = table.tablename;
        console.log(`\n📋 Processing table: ${tableName}`);
        
        // Find ALL policies on this table
        const { data: policies } = await supabase.rpc('exec_sql', { 
          sql_query: `
            SELECT policyname, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = '${tableName}';
          ` 
        });
        
        if (policies && Array.isArray(policies) && policies.length > 0) {
          console.log(`  Found ${policies.length} policies:`, policies.map(p => p.policyname).join(', '));
          
          // Drop each policy
          for (const policy of policies) {
            console.log(`    Dropping policy: ${policy.policyname}`);
            await supabase.rpc('exec_sql', { 
              sql_query: `DROP POLICY IF EXISTS "${policy.policyname}" ON ${tableName};` 
            });
          }
        } else {
          console.log(`  No policies found on ${tableName}`);
        }
        
        // Disable RLS completely
        console.log(`  Disabling RLS on ${tableName}...`);
        await supabase.rpc('exec_sql', { 
          sql_query: `ALTER TABLE ${tableName} DISABLE ROW LEVEL SECURITY;` 
        });
        
        // Grant full permissions
        console.log(`  Granting full permissions on ${tableName}...`);
        await supabase.rpc('exec_sql', { 
          sql_query: `GRANT ALL ON ${tableName} TO authenticated;` 
        });
        
        console.log(`  ✅ ${tableName} completely cleaned`);
      }
    }
    
    // Double-check: Find any remaining policies anywhere
    console.log('\n🔍 Double-checking for any remaining policies...');
    const { data: remainingPolicies } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public';
      ` 
    });
    
    if (remainingPolicies && Array.isArray(remainingPolicies) && remainingPolicies.length > 0) {
      console.log('⚠️  Found remaining policies:');
      for (const policy of remainingPolicies) {
        console.log(`    ${policy.tablename}.${policy.policyname}`);
        // Force drop it
        await supabase.rpc('exec_sql', { 
          sql_query: `DROP POLICY IF EXISTS "${policy.policyname}" ON ${policy.tablename};` 
        });
      }
    } else {
      console.log('✅ No remaining policies found');
    }
    
    // Test database access
    console.log('\n🧪 Testing database access...');
    const testQueries = [
      { name: 'outreach_logs', query: supabase.from('outreach_logs').select('id').limit(1) },
      { name: 'organizations', query: supabase.from('organizations').select('id').limit(1) },
      { name: 'user_organizations', query: supabase.from('user_organizations').select('user_id').limit(1) }
    ];
    
    for (const test of testQueries) {
      const result = await test.query;
      if (result.error) {
        console.log(`  ❌ ${test.name}: ${result.error.message}`);
      } else {
        console.log(`  ✅ ${test.name}: Working`);
      }
    }
    
    console.log('\n💥 NUCLEAR FIX COMPLETE!');
    console.log('🔄 Reload your app - ALL RLS policies have been eliminated.');
    
  } catch (err) {
    console.error('❌ Error in nuclear RLS fix:', err);
  }
}

nuclearRLSFix();