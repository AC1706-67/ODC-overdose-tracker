/**
 * Diagnostic Script: Team Member Organization Isolation
 *
 * This script helps diagnose team member data leakage between organizations.
 * Run with: node diagnose-team-member-isolation.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function diagnose() {
  console.log('🔍 Team Member Organization Isolation Diagnostic\n');

  try {
    // 1. Get all organizations
    console.log('📋 Step 1: Fetching all organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    if (orgsError) throw orgsError;

    console.log(`✅ Found ${orgs.length} organizations:\n`);
    orgs.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (${org.slug})`);
      console.log(`      ID: ${org.id}\n`);
    });

    // 2. For each organization, get team members
    console.log('\n👥 Step 2: Fetching team members per organization...\n');

    for (const org of orgs) {
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('id, name, email, role, is_active, organization_id')
        .eq('organization_id', org.id)
        .order('name');

      if (membersError) {
        console.error(`   ❌ Error fetching members for ${org.name}:`, membersError);
        continue;
      }

      console.log(`   ${org.name}:`);
      if (members.length === 0) {
        console.log(`      (no team members)\n`);
      } else {
        members.forEach((member) => {
          const status = member.is_active ? '✓' : '✗';
          console.log(`      ${status} ${member.name} ${member.role ? `(${member.role})` : ''}`);
          console.log(`         ID: ${member.id}`);
          console.log(`         Org ID: ${member.organization_id}`);
          if (member.email) console.log(`         Email: ${member.email}`);
        });
        console.log('');
      }
    }

    // 3. Check for orphaned team members (no valid org)
    console.log('\n🔍 Step 3: Checking for orphaned team members...\n');

    const { data: allMembers, error: allMembersError } = await supabase
      .from('team_members')
      .select('id, name, organization_id');

    if (allMembersError) throw allMembersError;

    const validOrgIds = new Set(orgs.map((o) => o.id));
    const orphaned = allMembers.filter(
      (m) => !m.organization_id || !validOrgIds.has(m.organization_id),
    );

    if (orphaned.length > 0) {
      console.log(`   ⚠️  Found ${orphaned.length} orphaned team members:`);
      orphaned.forEach((member) => {
        console.log(`      - ${member.name} (ID: ${member.id})`);
        console.log(`        Org ID: ${member.organization_id || 'NULL'}\n`);
      });
    } else {
      console.log('   ✅ No orphaned team members found\n');
    }

    // 4. Test the actual query used by TeamMemberPicker
    console.log('\n🧪 Step 4: Testing TeamMemberPicker query for each org...\n');

    for (const org of orgs) {
      console.log(`   Testing query for: ${org.name}`);

      const { data: pickerMembers, error: pickerError } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .order('name');

      if (pickerError) {
        console.error(`   ❌ Error:`, pickerError);
      } else {
        console.log(`   ✅ Query returned ${pickerMembers.length} members`);
        if (pickerMembers.length > 0) {
          console.log(`      Members: ${pickerMembers.map((m) => m.name).join(', ')}`);
        }
      }
      console.log('');
    }

    // 5. Summary
    console.log('\n📊 Summary:\n');
    console.log(`   Total Organizations: ${orgs.length}`);
    console.log(`   Total Team Members: ${allMembers.length}`);
    console.log(`   Orphaned Members: ${orphaned.length}`);

    if (orphaned.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   Orphaned team members found. These should be:');
      console.log('   1. Assigned to the correct organization, OR');
      console.log('   2. Deleted if they are invalid/test data\n');
    } else {
      console.log('\n✅ All team members are properly assigned to organizations');
    }

    // 6. Check if there's cross-contamination
    console.log('\n🔬 Step 5: Checking for potential cross-contamination...\n');

    const orgMemberMap = {};
    orgs.forEach((org) => {
      orgMemberMap[org.id] = [];
    });

    allMembers.forEach((member) => {
      if (orgMemberMap[member.organization_id]) {
        orgMemberMap[member.organization_id].push(member.name);
      }
    });

    let crossContamination = false;
    for (const org of orgs) {
      const members = orgMemberMap[org.id];
      for (const otherOrg of orgs) {
        if (org.id === otherOrg.id) continue;

        const otherMembers = orgMemberMap[otherOrg.id];
        const overlap = members.filter((name) => otherMembers.includes(name));

        if (overlap.length > 0) {
          crossContamination = true;
          console.log(`   ⚠️  Found ${overlap.length} members with same name in both:`);
          console.log(`      - ${org.name}`);
          console.log(`      - ${otherOrg.name}`);
          console.log(`      Names: ${overlap.join(', ')}\n`);
          console.log(
            '      Note: This is OK if they are different people with the same name.',
          );
          console.log('      But verify they have different IDs.\n');
        }
      }
    }

    if (!crossContamination) {
      console.log('   ✅ No name overlaps found between organizations\n');
    }

    console.log('\n✨ Diagnostic complete!\n');
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    console.error(error);
  }
}

diagnose();
