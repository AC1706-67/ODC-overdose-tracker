const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRecursion() {
  try {
    console.log('🔧 Fixing RLS recursion issue...');
    
    // Disable RLS temporarily
    console.log('1. Disabling RLS...');
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;' 
    });
    
    // Drop problematic policies
    console.log('2. Dropping old policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;',
      'DROP POLICY IF EXISTS "Users can manage their own organization memberships" ON user_organizations;',
      'DROP POLICY IF EXISTS "Organization members can view memberships" ON user_organizations;'
    ];
    
    for (const policy of dropPolicies) {
      await supabase.rpc('exec_sql', { sql_query: policy });
    }
    
    // Create simple, non-recursive policy
    console.log('3. Creating simple policy...');
    await supabase.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "simple_user_access" ON user_organizations FOR ALL TO authenticated USING (auth.uid() = user_id);' 
    });
    
    // Re-enable RLS
    console.log('4. Re-enabling RLS...');
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;' 
    });
    
    // Fix organizations table too
    console.log('5. Fixing organizations table...');
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'DROP POLICY IF EXISTS "Organization members can view organization" ON organizations;' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'CREATE POLICY "public_org_access" ON organizations FOR SELECT TO authenticated USING (true);' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;' 
    });
    
    console.log('✅ RLS recursion fix completed successfully!');
    console.log('🔄 Please refresh your app to see the changes.');
    
  } catch (err) {
    console.error('❌ Error fixing RLS:', err);
  }
}

fixRecursion();