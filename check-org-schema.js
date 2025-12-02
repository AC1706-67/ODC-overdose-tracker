require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function checkSchema() {
  console.log('📋 Checking organizations table schema...\n');

  // Get a sample org to see structure
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (orgError) {
    console.error('Error fetching orgs:', orgError);
  } else {
    console.log('Organizations columns:', Object.keys(orgs[0] || {}));
    console.log('Sample org:', orgs[0]);
  }

  console.log('\n📋 Checking organization_invite_codes table...\n');

  const { data: codes, error: codeError } = await supabase
    .from('organization_invite_codes')
    .select('*')
    .limit(1);

  if (codeError) {
    console.error('Error fetching codes:', codeError);
  } else {
    console.log('Invite codes columns:', Object.keys(codes[0] || {}));
    console.log('Sample code:', codes[0]);
  }

  console.log('\n📋 Checking user_organizations table...\n');

  const { data: userOrgs, error: userOrgError } = await supabase
    .from('user_organizations')
    .select('*')
    .limit(1);

  if (userOrgError) {
    console.error('Error fetching user_organizations:', userOrgError);
  } else {
    console.log('User organizations columns:', Object.keys(userOrgs[0] || {}));
    console.log('Sample user_org:', userOrgs[0]);
  }
}

checkSchema().catch(console.error);
