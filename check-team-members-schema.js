const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

async function checkTeamMembersSchema() {
  console.log('🔍 Checking team_members table schema...');
  
  try {
    // Check team_members table structure
    const { data: teamMembersColumns, error: tmError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'team_members')
      .order('ordinal_position');

    if (tmError) {
      console.error('❌ Error checking team_members schema:', tmError);
      return;
    }

    console.log('\n📋 team_members table columns:');
    teamMembersColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });

    // Check organizations table structure
    const { data: orgColumns, error: orgError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'organizations')
      .order('ordinal_position');

    if (orgError) {
      console.error('❌ Error checking organizations schema:', orgError);
      return;
    }

    console.log('\n📋 organizations table columns:');
    orgColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
    });

    // Check if organizations table has slug column
    const hasSlug = orgColumns.some(col => col.column_name === 'slug');
    console.log(`\n✅ Organizations table has slug column: ${hasSlug}`);

    // Check if team_members has expected columns
    const expectedColumns = ['id', 'name', 'organization_id', 'email', 'role', 'is_active'];
    const missingColumns = expectedColumns.filter(col => 
      !teamMembersColumns.some(dbCol => dbCol.column_name === col)
    );

    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Missing columns in team_members: ${missingColumns.join(', ')}`);
    } else {
      console.log('\n✅ All expected columns present in team_members table');
    }

    // Test a sample organization lookup
    const { data: sampleOrg, error: sampleError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(1)
      .single();

    if (sampleError) {
      console.log('\n⚠️  No organizations found or error:', sampleError.message);
    } else {
      console.log('\n📋 Sample organization:');
      console.log(`  - ID: ${sampleOrg.id}`);
      console.log(`  - Name: ${sampleOrg.name}`);
      console.log(`  - Slug: ${sampleOrg.slug}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTeamMembersSchema();