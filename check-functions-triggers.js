const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctionsAndTriggers() {
  try {
    console.log('🔍 Checking for functions and triggers that might cause recursion...');
    
    // Check for custom functions
    console.log('\n1. Checking custom functions...');
    const { data: functions } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT routine_name, routine_definition 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name NOT LIKE 'pg_%';
      ` 
    });
    
    if (functions && Array.isArray(functions)) {
      console.log(`Found ${functions.length} custom functions:`);
      functions.forEach(func => {
        console.log(`  - ${func.routine_name}`);
      });
    }
    
    // Check for triggers
    console.log('\n2. Checking triggers...');
    const { data: triggers } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT trigger_name, event_object_table, action_statement 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public';
      ` 
    });
    
    if (triggers && Array.isArray(triggers)) {
      console.log(`Found ${triggers.length} triggers:`);
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    }
    
    // Check RLS status on all tables
    console.log('\n3. Checking RLS status...');
    const { data: rlsStatus } = await supabase.rpc('exec_sql', { 
      sql_query: `
        SELECT schemaname, tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      ` 
    });
    
    if (rlsStatus && Array.isArray(rlsStatus)) {
      console.log('RLS Status:');
      rlsStatus.forEach(table => {
        console.log(`  - ${table.tablename}: ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
    }
    
    // Try a simple insert to see the exact error
    console.log('\n4. Testing simple insert...');
    const testInsert = await supabase.from('outreach_logs').insert({
      zip_code: '12345',
      kit_types: ['Test'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      outreach_date: '2025-10-28'
    });
    
    if (testInsert.error) {
      console.log('❌ Insert error:', testInsert.error);
    } else {
      console.log('✅ Insert successful');
      // Clean up test record
      if (testInsert.data && testInsert.data[0]) {
        await supabase.from('outreach_logs').delete().eq('id', testInsert.data[0].id);
      }
    }
    
  } catch (err) {
    console.error('❌ Error checking functions/triggers:', err);
  }
}

checkFunctionsAndTriggers();