const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTeamMemberCreation() {
  try {
    console.log('1. Checking organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, slug, name')
      .eq('is_active', true);
    
    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return;
    }
    
    console.log('Available organizations:', orgs);
    
    if (orgs.length === 0) {
      console.log('No active organizations found');
      return;
    }
    
    // Use the first organization
    const testOrg = orgs[0];
    console.log(`\n2. Testing with organization: ${testOrg.name} (${testOrg.slug})`);
    
    // Test the create_team_member function
    console.log('\n3. Testing create_team_member function...');
    const { data, error } = await supabase.rpc('create_team_member', {
      p_full_name: 'Test Member',
      p_email: 'test@example.com',
      p_role: 'volunteer',
      p_org_slug: testOrg.slug
    });
    
    if (error) {
      console.error('Error calling create_team_member:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Success! Created team member:', data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugTeamMemberCreation();