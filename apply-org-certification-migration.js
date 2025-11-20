require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🚀 Applying organization certification migration...\n');
  
  const sql = fs.readFileSync('supabase/migrations/20251119_add_org_certification_and_codes.sql', 'utf8');
  
  // Split by statement and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.error('❌ Error executing statement:', error);
        console.log('Statement:', statement.substring(0, 100) + '...');
      } else {
        console.log('✅ Executed statement');
      }
    } catch (err) {
      console.error('❌ Exception:', err.message);
    }
  }
  
  console.log('\n✅ Migration complete!');
  
  // Verify the changes
  console.log('\n📋 Verifying changes...\n');
  
  const { data: codes, error: codeError } = await supabase
    .from('organization_invite_codes')
    .select('*');
  
  if (codeError) {
    console.error('Error fetching codes:', codeError);
  } else {
    console.log(`Found ${codes.length} invite codes:`);
    codes.forEach(code => {
      console.log(`  - ${code.code}: ${code.description} (${code.is_active ? 'active' : 'inactive'})`);
    });
  }
  
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('name, is_certified, status');
  
  if (orgError) {
    console.error('Error fetching orgs:', orgError);
  } else {
    console.log(`\nOrganizations:`);
    orgs.forEach(org => {
      console.log(`  - ${org.name}: ${org.status} (certified: ${org.is_certified})`);
    });
  }
}

applyMigration().catch(console.error);
