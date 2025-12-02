require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying ZIP code constraint migration...');

    // Step 1: Drop existing constraint
    console.log('Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_zip_code_check;',
    });

    if (dropError) {
      console.error('Failed to drop constraint:', dropError);
    }

    // Step 2: Add new constraint
    console.log('Adding new constraint...');
    const { error: addError } = await supabase.rpc('exec', {
      sql: `ALTER TABLE incidents ADD CONSTRAINT incidents_zip_code_check 
            CHECK (zip_code ~ '^[0-9]{5}$' OR zip_code IN ('NA', 'Unknown'));`,
    });

    if (addError) {
      console.error('Failed to add constraint:', addError);
      process.exit(1);
    }

    console.log('✅ ZIP code constraint updated successfully!');
    console.log('The zip_code field now accepts:');
    console.log('- 5-digit ZIP codes (e.g., "12345")');
    console.log('- "NA" for not available');
    console.log('- "Unknown" for unknown ZIP codes');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
