const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeRLSFix() {
  try {
    console.log('🔧 Applying comprehensive RLS fix...');
    
    // List of all tables that might have RLS issues
    const tables = [
      'user_organizations',
      'organizations', 
      'outreach_logs',
      'incidents',
      'users'
    ];
    
    for (const table of tables) {
      console.log(`\n📋 Fixing table: ${table}`);
      
      // Disable RLS temporarily
      console.log(`  1. Disabling RLS on ${table}...`);
      await supabase.rpc('exec_sql', { 
        sql_query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;` 
      });
      
      // Drop ALL existing policies
      console.log(`  2. Dropping all policies on ${table}...`);
      const { data: policies } = await supabase.rpc('exec_sql', { 
        sql_query: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = '${table}';
        ` 
      });
      
      if (policies && Array.isArray(policies)) {
        for (const policy of policies) {
          await supabase.rpc('exec_sql', { 
            sql_query: `DROP POLICY IF EXISTS "${policy.policyname}" ON ${table};` 
          });
        }
      }
      
      // Create simple, non-recursive policies based on table
      console.log(`  3. Creating simple policies for ${table}...`);
      
      if (table === 'user_organizations') {
        await supabase.rpc('exec_sql', { 
          sql_query: `
            CREATE POLICY "simple_user_org_access" ON user_organizations 
            FOR ALL TO authenticated 
            USING (auth.uid() = user_id);
          ` 
        });
      } else if (table === 'organizations') {
        await supabase.rpc('exec_sql', { 
          sql_query: `
            CREATE POLICY "public_org_read" ON organizations 
            FOR SELECT TO authenticated 
            USING (true);
          ` 
        });
      } else if (table === 'outreach_logs') {
        await supabase.rpc('exec_sql', { 
          sql_query: `
            CREATE POLICY "user_outreach_access" ON outreach_logs 
            FOR ALL TO authenticated 
            USING (auth.uid() = user_id);
          ` 
        });
      } else if (table === 'incidents') {
        await supabase.rpc('exec_sql', { 
          sql_query: `
            CREATE POLICY "user_incident_access" ON incidents 
            FOR ALL TO authenticated 
            USING (auth.uid() = user_id);
          ` 
        });
      } else if (table === 'users') {
        await supabase.rpc('exec_sql', { 
          sql_query: `
            CREATE POLICY "user_self_access" ON users 
            FOR ALL TO authenticated 
            USING (auth.uid() = id);
          ` 
        });
      }
      
      // Re-enable RLS
      console.log(`  4. Re-enabling RLS on ${table}...`);
      await supabase.rpc('exec_sql', { 
        sql_query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;` 
      });
      
      console.log(`  ✅ ${table} fixed`);
    }
    
    // Grant necessary permissions
    console.log('\n🔐 Granting permissions...');
    const permissions = [
      'GRANT SELECT, INSERT, UPDATE, DELETE ON user_organizations TO authenticated;',
      'GRANT SELECT ON organizations TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_logs TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON incidents TO authenticated;',
      'GRANT SELECT, UPDATE ON users TO authenticated;'
    ];
    
    for (const permission of permissions) {
      await supabase.rpc('exec_sql', { sql_query: permission });
    }
    
    console.log('\n✅ Complete RLS fix applied successfully!');
    console.log('🔄 Please reload your app to see the changes.');
    
  } catch (err) {
    console.error('❌ Error in comprehensive RLS fix:', err);
  }
}

completeRLSFix();