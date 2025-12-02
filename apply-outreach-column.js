const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function applyMigration() {
  try {
    console.log('Adding outreach_enabled column...');

    const sql = fs.readFileSync('add-outreach-enabled-column.sql', 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('\nExecuting:', statement.substring(0, 100) + '...');
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement,
        });

        if (error) {
          console.error('Error:', error);
        } else {
          console.log('✓ Success');
          if (data) console.log('Result:', data);
        }
      }
    }

    console.log('\n=== Verifying organizations ===');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, slug, name, outreach_enabled')
      .order('name');

    if (orgsError) {
      console.error('Error fetching orgs:', orgsError);
    } else {
      console.table(orgs);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigration();
