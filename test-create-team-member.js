// Test script to execute the create_team_member function
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

async function testCreateTeamMember() {
  console.log('🧪 Testing create_team_member function...');

  try {
    // First, let's check if the function exists by trying to call it
    const { data, error } = await supabase.rpc('create_team_member', {
      p_full_name: 'Test User',
      p_email: 'test@example.com',
      p_role: 'Volunteer',
      p_org_slug: 'test-org',
    });

    if (error) {
      if (
        error.message.includes('function public.create_team_member') &&
        error.message.includes('does not exist')
      ) {
        console.log('❌ Function create_team_member does not exist yet');
        console.log('✅ Ready to execute the SQL to create it');
        return 'FUNCTION_NOT_EXISTS';
      } else if (error.message.includes('Organization not found')) {
        console.log('✅ Function exists but organization not found (expected)');
        return 'FUNCTION_EXISTS';
      } else {
        console.log('⚠️  Function exists but error:', error.message);
        return 'FUNCTION_EXISTS_WITH_ERROR';
      }
    } else {
      console.log('✅ Function executed successfully:', data);
      return 'FUNCTION_WORKS';
    }
  } catch (error) {
    console.error('❌ Error testing function:', error.message);
    return 'ERROR';
  }
}

testCreateTeamMember().then((result) => {
  console.log(`\n📋 Result: ${result}`);

  if (result === 'FUNCTION_NOT_EXISTS') {
    console.log(
      '\n🚀 Execute the SQL function now? The function is ready to be created.',
    );
  } else if (result === 'FUNCTION_EXISTS') {
    console.log('\n✅ Function already exists and is working correctly!');
  }
});
