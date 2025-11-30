/**
 * OUTREACH LOGS DIAGNOSTICS - Database Schema & RLS Analysis
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function runDiagnostics() {
  console.log('🔍 OUTREACH LOGS DIAGNOSTICS\n');
  console.log('='.repeat(60));

  // 1. Get table schema
  console.log('\n1️⃣ TABLE SCHEMA (outreach_logs columns):\n');
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_schema', 'public')
    .eq('table_name', 'outreach_logs')
    .order('ordinal_position');

  if (colError) {
    console.error('❌ Error fetching columns:', colError.message);
  } else {
    console.table(columns);
  }

  // 2. Get RLS policies
  console.log('\n2️⃣ RLS POLICIES:\n');
  const { data: policies, error: polError } = await supabase
    .from('pg_policies')
    .select('policyname, cmd, roles, qual, with_check')
    .eq('schemaname', 'public')
    .eq('tablename', 'outreach_logs')
    .order('cmd');

  if (polError) {
    console.error('❌ Error fetching policies:', polError.message);
  } else {
    if (policies && policies.length > 0) {
      policies.forEach(p => {
        console.log(`Policy: ${p.policyname}`);
        console.log(`  Command: ${p.cmd}`);
        console.log(`  Roles: ${p.roles}`);
        console.log(`  Using: ${p.qual || 'N/A'}`);
        console.log(`  With Check: ${p.with_check || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No RLS policies found');
    }
  }

  // 3. Count logs by organization
  console.log('\n3️⃣ LOGS BY ORGANIZATION:\n');
  const { data: orgCounts, error: countError } = await supabase
    .from('outreach_logs')
    .select('organization_id, organizations(name, slug)', { count: 'exact' });

  if (countError) {
    console.error('❌ Error counting logs:', countError.message);
  } else {
    const grouped = {};
    orgCounts?.forEach(log => {
      const orgId = log.organization_id;
      if (!grouped[orgId]) {
        grouped[orgId] = {
          org_id: orgId,
          org_name: log.organizations?.name || 'Unknown',
          org_slug: log.organizations?.slug || 'N/A',
          count: 0
        };
      }
      grouped[orgId].count++;
    });
    
    const summary = Object.values(grouped).sort((a, b) => b.count - a.count);
    console.table(summary);
    console.log(`Total logs across all orgs: ${orgCounts?.length || 0}`);
  }

  // 4. Organizations with outreach enabled
  console.log('\n4️⃣ ORGANIZATIONS WITH OUTREACH ENABLED:\n');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, outreach_enabled, is_active')
    .eq('outreach_enabled', true)
    .order('name');

  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError.message);
  } else {
    console.table(orgs);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostics complete\n');
}

runDiagnostics().catch(console.error);
