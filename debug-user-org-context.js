require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugUserOrg() {
  console.log('🔍 Debugging User Organization Context\n');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ Not authenticated or error:', userError);
    console.log('\n⚠️  Please log in first using the app or provide credentials\n');
    return;
  }
  
  console.log('✅ Authenticated as:', user.email);
  console.log('   User ID:', user.id);
  console.log();
  
  // Check user_organizations
  console.log('📋 Checking user_organizations table...');
  const { data: userOrgs, error: userOrgsError } = await supabase
    .from('user_organizations')
    .select('*, organizations(*)')
    .eq('user_id', user.id);
  
  if (userOrgsError) {
    console.error('❌ Error fetching user organizations:', userOrgsError);
  } else if (!userOrgs || userOrgs.length === 0) {
    console.log('⚠️  User has NO organization memberships!');
    console.log('   This is why Outreach tab is not showing.\n');
    console.log('💡 Solution: Add user to an organization:');
    console.log(`
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES (
  '${user.id}',
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-of-el-paso'),
  'Responder',
  true
);
    `);
  } else {
    console.log(`✅ Found ${userOrgs.length} organization membership(s):\n`);
    userOrgs.forEach((uo, idx) => {
      console.log(`${idx + 1}. Organization: ${uo.organizations?.name || 'Unknown'}`);
      console.log(`   - ID: ${uo.organization_id}`);
      console.log(`   - Role: ${uo.role}`);
      console.log(`   - Active: ${uo.is_active}`);
      console.log(`   - Joined: ${uo.joined_at}`);
      console.log();
    });
    
    // Check if any are active
    const activeOrgs = userOrgs.filter(uo => uo.is_active);
    if (activeOrgs.length === 0) {
      console.log('⚠️  User has organizations but NONE are active!');
      console.log('   Set is_active = true to enable access.\n');
    } else {
      console.log(`✅ User has ${activeOrgs.length} active organization(s)`);
      console.log('   Outreach tab SHOULD be visible.\n');
    }
  }
  
  // Check organizations table
  console.log('📋 Checking organizations table...');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug, is_active')
    .order('name');
  
  if (orgsError) {
    console.error('❌ Error fetching organizations:', orgsError);
  } else {
    console.log(`✅ Found ${orgs.length} total organizations:\n`);
    orgs.forEach((org, idx) => {
      console.log(`${idx + 1}. ${org.name}`);
      console.log(`   - Slug: ${org.slug}`);
      console.log(`   - ID: ${org.id}`);
      console.log(`   - Active: ${org.is_active}`);
      console.log();
    });
  }
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('DIAGNOSIS:');
  if (!userOrgs || userOrgs.length === 0) {
    console.log('❌ User is NOT in any organization');
    console.log('   → Outreach tab will NOT show');
    console.log('   → Need to add user to organization');
  } else {
    const activeOrgs = userOrgs.filter(uo => uo.is_active);
    if (activeOrgs.length === 0) {
      console.log('⚠️  User has organizations but none are active');
      console.log('   → Outreach tab will NOT show');
      console.log('   → Need to activate membership');
    } else {
      console.log('✅ User has active organization membership');
      console.log('   → Outreach tab SHOULD show');
      console.log('   → If not showing, check:');
      console.log('     1. App has latest code (git pull)');
      console.log('     2. App was rebuilt after code changes');
      console.log('     3. OrgContext is loading correctly');
      console.log('     4. Check console logs in app for errors');
    }
  }
  console.log('═══════════════════════════════════════\n');
}

debugUserOrg().catch(console.error);
