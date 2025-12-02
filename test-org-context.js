const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrgContext() {
  try {
    console.log('🔍 Testing organization-related issues...');

    // Check foreign key constraints on outreach_logs
    console.log('\n1. Checking foreign key constraints...');
    const { data: constraints } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'outreach_logs';
      `,
    });

    if (constraints && Array.isArray(constraints)) {
      console.log(
        `Found ${constraints.length} foreign key constraints on outreach_logs:`,
      );
      constraints.forEach((constraint) => {
        console.log(
          `  - ${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`,
        );
      });
    }

    // Test insert with organization_id = null (anonymous)
    console.log('\n2. Testing insert with organization_id = null...');
    const testNull = await supabase.from('outreach_logs').insert({
      zip_code: '12345',
      kit_types: ['Test'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      outreach_date: '2025-10-28',
      organization_id: null,
    });

    if (testNull.error) {
      console.log('❌ Insert with null org_id error:', testNull.error);
    } else {
      console.log('✅ Insert with null org_id successful');
      // Clean up
      if (testNull.data && testNull.data[0]) {
        await supabase
          .from('outreach_logs')
          .delete()
          .eq('id', testNull.data[0].id);
      }
    }

    // Test insert with a fake organization_id
    console.log('\n3. Testing insert with fake organization_id...');
    const testFake = await supabase.from('outreach_logs').insert({
      zip_code: '12345',
      kit_types: ['Test'],
      num_kits: 1,
      people_reached: 1,
      males_reached: 1,
      females_reached: 0,
      outreach_date: '2025-10-28',
      organization_id: 'fake-uuid-12345',
    });

    if (testFake.error) {
      console.log('❌ Insert with fake org_id error:', testFake.error);
    } else {
      console.log('✅ Insert with fake org_id successful');
      // Clean up
      if (testFake.data && testFake.data[0]) {
        await supabase
          .from('outreach_logs')
          .delete()
          .eq('id', testFake.data[0].id);
      }
    }

    // Check what organizations exist
    console.log('\n4. Checking existing organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) {
      console.log('❌ Error fetching organizations:', orgError);
    } else if (orgs) {
      console.log(`Found ${orgs.length} organizations:`);
      orgs.forEach((org) => {
        console.log(`  - ${org.id}: ${org.name}`);
      });
    }
  } catch (err) {
    console.error('❌ Error testing org context:', err);
  }
}

testOrgContext();
