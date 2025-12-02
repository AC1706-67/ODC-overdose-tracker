const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log(
    '⚠️  Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
  );
  console.log('Or update this script with your actual Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExistingFunction() {
  console.log('🔍 Inspecting existing create_team_member function...');

  try {
    // Query the function definition from pg_proc
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          p.proname as function_name,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          pg_catalog.pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE p.proname = 'create_team_member'
          AND n.nspname = 'public';
      `,
    });

    if (error) {
      console.error('❌ Error querying function:', error);

      // Try alternative approach using information_schema
      const { data: altData, error: altError } = await supabase
        .from('information_schema.routines')
        .select('*')
        .eq('routine_name', 'create_team_member')
        .eq('routine_schema', 'public');

      if (altError) {
        console.error('❌ Alternative query also failed:', altError);
        return;
      }

      if (altData && altData.length > 0) {
        console.log('📋 Function found via information_schema:');
        console.log(JSON.stringify(altData[0], null, 2));
      } else {
        console.log('❓ No function found with name create_team_member');
      }
      return;
    }

    if (data && data.length > 0) {
      const func = data[0];
      console.log('📋 Existing function details:');
      console.log(`  Function Name: ${func.function_name}`);
      console.log(`  Return Type: ${func.return_type}`);
      console.log(`  Arguments: ${func.arguments}`);
      console.log('\n📄 Full Definition:');
      console.log(func.definition);
    } else {
      console.log('❓ No function found with name create_team_member');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try a simple test call to see what happens
    console.log('\n🧪 Testing function call to see current behavior...');
    try {
      const { data: testData, error: testError } = await supabase.rpc(
        'create_team_member',
        {
          p_full_name: 'Test User',
          p_email: 'test@example.com',
          p_role: 'Test Role',
          p_org_slug: 'test-org',
        },
      );

      if (testError) {
        console.log('📋 Function call error (expected):', testError.message);
        console.log(
          'This tells us the function exists but may have different parameters or return type',
        );
      } else {
        console.log('📋 Function call succeeded, returned:', testData);
        console.log('Type of returned data:', typeof testData);
      }
    } catch (testErr) {
      console.log('📋 Function test error:', testErr.message);
    }
  }
}

inspectExistingFunction();
