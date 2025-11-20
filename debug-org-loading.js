const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugOrgLoading() {
  try {
    console.log('\n=== Checking Organizations ===');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('name');
    
    if (orgsError) {
      console.error('Error:', orgsError);
    } else {
      console.table(orgs);
    }

    console.log('\n=== Checking User Organizations ===');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select(`
        *,
        organizations (*)
      `);
    
    if (userOrgsError) {
      console.error('Error:', userOrgsError);
    } else {
      console.log('User Organizations:');
      userOrgs.forEach(uo => {
        console.log(`\nUser: ${uo.user_id}`);
        console.log(`Org: ${uo.organizations?.name} (${uo.organizations?.slug})`);
        console.log(`Org ID: ${uo.organizations?.id}`);
        console.log(`Role: ${uo.role}`);
        console.log(`Active: ${uo.is_active}`);
      });
    }

    console.log('\n=== Testing canUseOutreach logic ===');
    const CANON_RAEP_ID = '6e892800-0429-442f-bff8-417b4d4ec793';
    
    orgs.forEach(org => {
      const matchesId = org.id === CANON_RAEP_ID;
      const matchesSlug = ['recovery-alliance-el-paso', 'recovery-alliance-of-el-paso', 'recovery-alliance', 'raep'].includes(org.slug?.toLowerCase());
      const matchesName = ['recovery alliance of el paso', 'recovery alliance'].includes(org.name?.toLowerCase());
      
      console.log(`\n${org.name}:`);
      console.log(`  ID: ${org.id} ${matchesId ? '✓ MATCHES CANON ID' : ''}`);
      console.log(`  Slug: ${org.slug} ${matchesSlug ? '✓ MATCHES' : ''}`);
      console.log(`  Name: ${org.name} ${matchesName ? '✓ MATCHES' : ''}`);
      console.log(`  Should have outreach: ${matchesId || matchesSlug || matchesName ? 'YES' : 'NO'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugOrgLoading();
