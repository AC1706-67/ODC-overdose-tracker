const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUserToRAEP() {
  try {
    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    
    console.log('\n=== All Users ===');
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });

    // Get Recovery Alliance org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'raep')
      .single();
    
    if (orgError) throw orgError;
    console.log('\n=== Recovery Alliance Org ===');
    console.log(org);

    // Get existing memberships
    const { data: memberships, error: membError } = await supabase
      .from('user_organizations')
      .select('*, users:user_id(email)')
      .eq('organization_id', org.id);
    
    console.log('\n=== Current RAEP Members ===');
    memberships?.forEach(m => {
      console.log(`- ${m.users?.email} (${m.role})`);
    });

    // Find the newest user (likely the one you just created)
    const newestUser = users.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];

    console.log(`\n=== Adding newest user to RAEP ===`);
    console.log(`User: ${newestUser.email}`);

    // Add user to Recovery Alliance
    const { data: newMembership, error: addError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: newestUser.id,
        organization_id: org.id,
        role: 'peer',
        is_active: true
      })
      .select()
      .single();

    if (addError) {
      if (addError.code === '23505') {
        console.log('✓ User already in organization');
      } else {
        throw addError;
      }
    } else {
      console.log('✓ User added to Recovery Alliance!');
      console.log(newMembership);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addUserToRAEP();
