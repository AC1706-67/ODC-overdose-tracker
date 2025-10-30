const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        }
    }
);

async function applyDashboardMigration() {
    console.log('🚀 Applying dashboard migration...');

    try {
        // Read the migration file
        const migrationSQL = fs.readFileSync('supabase/migrations/20251012_create_dashboard_views.sql', 'utf8');

        // Split into individual statements (rough split by semicolon + newline)
        const statements = migrationSQL
            .split(';\n')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            console.log(`\n${i + 1}. Executing statement...`);

            try {
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement
                });

                if (error) {
                    console.log(`❌ Error in statement ${i + 1}:`, error.message);
                    // Try alternative approach
                    console.log('Trying direct query...');
                    const { data: directData, error: directError } = await supabase
                        .from('_temp_migration')
                        .select('*')
                        .limit(0);

                    if (directError) {
                        console.log('Direct query also failed, continuing...');
                    }
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
            } catch (err) {
                console.log(`❌ Exception in statement ${i + 1}:`, err.message);
            }
        }

        // Test if views were created
        console.log('\n🔍 Testing if views were created...');

        const { data: kpiTest, error: kpiError } = await supabase
            .from('org_dashboard_kpis')
            .select('*')
            .limit(1);

        if (kpiError) {
            console.log('❌ Dashboard views still not accessible:', kpiError.message);
            console.log('\n📝 You need to run this SQL manually in your Supabase SQL editor:');
            console.log('='.repeat(60));
            console.log(migrationSQL);
            console.log('='.repeat(60));
        } else {
            console.log('✅ Dashboard views created successfully!');
        }

    } catch (error) {
        console.log('❌ Migration failed:', error.message);

        // Provide manual instructions
        console.log('\n📝 Please run this migration manually:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of supabase/migrations/20251012_create_dashboard_views.sql');
        console.log('4. Run the SQL');
    }
}

applyDashboardMigration();