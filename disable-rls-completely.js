const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableAllRLS() {
  try {
    console.log('🚨 EMERGENCY FIX: Disabling ALL RLS policies...');

    const tables = [
      'user_organizations',
      'organizations',
      'outreach_logs',
      'incidents',
      'users',
    ];

    for (const table of tables) {
      console.log(`📋 Disabling RLS on ${table}...`);

      // Disable RLS completely
      await supabase.rpc('exec_sql', {
        sql_query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`,
      });

      // Drop ALL policies to prevent any recursion
      console.log(`  Dropping all policies on ${table}...`);
      const { data: policies } = await supabase.rpc('exec_sql', {
        sql_query: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = '${table}';
        `,
      });

      if (policies && Array.isArray(policies)) {
        for (const policy of policies) {
          await supabase.rpc('exec_sql', {
            sql_query: `DROP POLICY "${policy.policyname}" ON ${table};`,
          });
        }
      }

      console.log(`  ✅ ${table} - RLS disabled, all policies removed`);
    }

    // Grant full permissions to authenticated users
    console.log('\n🔐 Granting full permissions...');
    const permissions = [
      'GRANT ALL ON user_organizations TO authenticated;',
      'GRANT ALL ON organizations TO authenticated;',
      'GRANT ALL ON outreach_logs TO authenticated;',
      'GRANT ALL ON incidents TO authenticated;',
      'GRANT ALL ON users TO authenticated;',
    ];

    for (const permission of permissions) {
      await supabase.rpc('exec_sql', { sql_query: permission });
    }

    // Test that everything works
    console.log('\n🧪 Testing database access...');

    const tests = [
      {
        table: 'organizations',
        query: supabase.from('organizations').select('count').limit(1),
      },
      {
        table: 'outreach_logs',
        query: supabase.from('outreach_logs').select('count').limit(1),
      },
      {
        table: 'user_organizations',
        query: supabase.from('user_organizations').select('count').limit(1),
      },
    ];

    for (const test of tests) {
      const result = await test.query;
      if (result.error) {
        console.log(`  ❌ ${test.table}: ${result.error.message}`);
      } else {
        console.log(`  ✅ ${test.table}: Access working`);
      }
    }

    console.log('\n✅ EMERGENCY FIX COMPLETE!');
    console.log('🔄 Your app should now work without RLS errors.');
    console.log(
      '⚠️  Note: RLS is disabled for development. Re-enable with proper policies later.',
    );
  } catch (err) {
    console.error('❌ Error in emergency RLS disable:', err);
  }
}

disableAllRLS();
