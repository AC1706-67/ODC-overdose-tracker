require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function checkUserOrg() {
  console.log('\n=== Checking User Organization Status ===\n');

  // Get all users
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('email');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log(`Found ${profiles.length} users:\n`);

  for (const profile of profiles) {
    console.log(`\n📧 ${profile.email} (${profile.full_name || 'No name'})`);
    console.log(`   User ID: ${profile.id}`);

    // Check their organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('user_organizations')
      .select(
        `
        id,
        organization_id,
        role,
        is_active,
        organizations (
          id,
          name,
          slug,
          is_active
        )
      `,
      )
      .eq('user_id', profile.id);

    if (membershipError) {
      console.error('   ❌ Error fetching memberships:', membershipError);
      continue;
    }

    if (!memberships || memberships.length === 0) {
      console.log('   ⚠️  NO ORGANIZATION ASSIGNED');
      console.log('   → Need to run ensure-user-has-org.sql');
    } else {
      console.log(`   ✅ ${memberships.length} organization(s):`);
      memberships.forEach((m) => {
        const org = m.organizations;
        console.log(`      - ${org.name} (${org.slug})`);
        console.log(`        Role: ${m.role}, Active: ${m.is_active}`);
        console.log(`        Org ID: ${m.organization_id}`);
      });
    }
  }

  // Check available organizations
  console.log('\n\n=== Available Organizations ===\n');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, is_active')
    .order('name');

  if (orgError) {
    console.error('Error fetching organizations:', orgError);
    return;
  }

  orgs.forEach((org) => {
    console.log(`${org.is_active ? '✅' : '❌'} ${org.name} (${org.slug})`);
    console.log(`   ID: ${org.id}`);
  });

  console.log('\n');
}

checkUserOrg().catch(console.error);
