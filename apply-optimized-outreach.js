const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyOptimizedOutreachSchema() {
  try {
    console.log('🚀 Applying optimized outreach schema...');

    const sqlContent = fs.readFileSync('optimized-outreach-schema.sql', 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(
        `📄 ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`,
      );

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement,
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with other statements for non-critical errors
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          (error.message.includes('constraint') &&
            error.message.includes('already'))
        ) {
          console.log('⚠️  Non-critical error, continuing...');
          continue;
        }
        throw error;
      }

      console.log(`✅ Statement ${i + 1} completed successfully`);
    }

    console.log('\n🎉 Optimized outreach schema applied successfully!');
    console.log('\n📊 Verifying schema changes...');

    // Verify the changes
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'outreach_logs')
      .in('column_name', [
        'outreach_date',
        'team_members',
        'team_organization',
        'trip_count',
        'males_reached',
        'females_reached',
      ]);

    if (colError) {
      console.error('❌ Error verifying columns:', colError);
    } else {
      console.log('\n📋 Updated columns:');
      columns.forEach((col) => {
        console.log(
          `  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
        );
      });
    }
  } catch (error) {
    console.error('❌ Failed to apply optimized schema:', error.message);
    process.exit(1);
  }
}

applyOptimizedOutreachSchema();
