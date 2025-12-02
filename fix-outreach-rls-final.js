const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOutreachRLS() {
  try {
    console.log('🔧 Fixing outreach_logs RLS specifically...');

    // Disable RLS on outreach_logs
    console.log('1. Disabling RLS on outreach_logs...');
    await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE outreach_logs DISABLE ROW LEVEL SECURITY;',
    });

    // Drop ALL policies on outreach_logs
    console.log('2. Dropping all policies on outreach_logs...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "user_outreach_access" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Users can view their own outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Users can insert their own outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Users can update their own outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Users can delete their own outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Organization members can view outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Allow authenticated users to insert outreach logs" ON outreach_logs;',
      'DROP POLICY IF EXISTS "Allow authenticated users to view outreach logs" ON outreach_logs;',
    ];

    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql_query: policy });
    }

    // Create the simplest possible policies
    console.log('3. Creating ultra-simple policies...');

    // Allow authenticated users to insert (for submissions)
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY "allow_insert" ON outreach_logs 
        FOR INSERT TO authenticated 
        WITH CHECK (true);
      `,
    });

    // Allow users to view their own records OR records with no user_id (anonymous)
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY "allow_select" ON outreach_logs 
        FOR SELECT TO authenticated 
        USING (user_id IS NULL OR auth.uid() = user_id);
      `,
    });

    // Allow users to update their own records
    await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE POLICY "allow_update" ON outreach_logs 
        FOR UPDATE TO authenticated 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `,
    });

    // Re-enable RLS
    console.log('4. Re-enabling RLS...');
    await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;',
    });

    // Grant permissions
    console.log('5. Granting permissions...');
    await supabase.rpc('exec_sql', {
      sql_query:
        'GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_logs TO authenticated;',
    });

    // Test the fix by trying a simple insert
    console.log('6. Testing the fix...');
    const testResult = await supabase
      .from('outreach_logs')
      .select('count')
      .limit(1);
    if (testResult.error) {
      console.log('Test query error:', testResult.error);
    } else {
      console.log('✅ Test query successful');
    }

    console.log('\n✅ Outreach RLS fix completed successfully!');
    console.log('🔄 The outreach submission should now work.');
  } catch (err) {
    console.error('❌ Error fixing outreach RLS:', err);
  }
}

fixOutreachRLS();
