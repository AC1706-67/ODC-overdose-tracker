/**
 * Find existing test users and their organization memberships
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function findTestUsers() {
  console.log('🔍 Finding test users and their organizations...\n');

  // Get organizations first
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, outreach_enabled')
    .order('name');

  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError.message);
    return;
  }

  console.log('📋 ORGANIZATIONS:\n');
  console.table(orgs);

  // Get user-organization memberships
  const { data: memberships, error: memberError } = await supabase
    .from('user_organizations')
    .select(`
      user_id,
      role,
      is_active,
      organizations!inner(
        name,
        slug,
        outreach_enabled
      )
    `)
    .eq('is_active', true);

  if (memberError) {
    console.error('❌ Error fetching memberships:', memberError.message);
    return;
  }

  console.log('\n👥 USER-ORGANIZATION MEMBERSHIPS:\n');
  
  if (!memberships || memberships.length === 0) {
    console.log('⚠️  No active user memberships found');
    return;
  }

  const grouped = {};
  memberships.forEach(m => {
    const userId = m.user_id;
    if (!grouped[userId]) {
      grouped[userId] = {
        user_id: userId,
        organizations: []
      };
    }
    grouped[userId].organizations.push({
      org: m.organizations.name,
      slug: m.organizations.slug,
      role: m.role,
      outreach: m.organizations.outreach_enabled
    });
  });

  Object.values(grouped).forEach(user => {
    console.log(`User ID: ${user.user_id}`);
    console.table(user.organizations);
    console.log('');
  });

  console.log('\n💡 TO USE THESE USERS IN TESTS:');
  console.log('1. You need to know the email addresses for these user IDs');
  console.log('2. Run this SQL in Supabase to see emails:');
  console.log('   SELECT id, email FROM auth.users WHERE id IN (');
  Object.keys(grouped).forEach((userId, i, arr) => {
    console.log(`     '${userId}'${i < arr.length - 1 ? ',' : ''}`);
  });
  console.log('   );');
  console.log('3. Update test-outreach-logs.ts with the correct email/password\n');
}

findTestUsers().catch(console.error);
