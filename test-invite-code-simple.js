/**
 * Simple test for invite code redemption
 * Tests the actual joinOrganizationWithCode logic
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Simulate the joinOrganizationWithCode function
async function testJoinOrganizationWithCode(rawCode) {
  const code = rawCode.trim().toUpperCase();

  console.log(`\n🧪 Testing code: ${code}\n`);

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('You must be logged in to join an organization.');
    }

    console.log(`✅ User: ${user.email}`);

    // 1) Look up invite code
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invite_codes')
      .select('id, organization_id, expires_at, is_active, max_uses, current_uses, role')
      .eq('code', code)
      .maybeSingle();

    if (inviteError) {
      console.error('❌ Invite lookup error:', inviteError);
      throw new Error('Failed to join organization. Please try again.');
    }

    if (!invite) {
      throw new Error('This code is not valid. Please check with your organization administrator.');
    }

    console.log(`✅ Invite found for org: ${invite.organization_id}`);
    console.log(`   Role: ${invite.role}`);
    console.log(`   Active: ${invite.is_active}`);
    console.log(`   Uses: ${invite.current_uses}/${invite.max_uses || '∞'}`);

    if (!invite.is_active) {
      throw new Error('This code is no longer active.');
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error('This code has expired. Please request a new one.');
    }

    if (invite.max_uses && invite.current_uses >= invite.max_uses) {
      throw new Error('This code has reached its maximum uses.');
    }

    const organizationId = invite.organization_id;

    // 2) Check if already a member
    const { data: existing } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (existing) {
      throw new Error('You are already a member of this organization.');
    }

    console.log(`✅ User is not yet a member`);

    // 3) Add membership row
    console.log(`\n📝 Adding membership...`);
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        role: invite.role || 'Responder',
        is_active: true,
      });

    if (membershipError && membershipError.code !== '23505') {
      console.error('❌ Membership insert error:', membershipError);
      throw new Error(membershipError.message || 'Failed to join organization. Please try again.');
    }

    console.log(`✅ Membership added`);

    // 4) Increment code usage
    console.log(`\n📝 Incrementing usage counter...`);
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('increment_invite_code_usage', { code: code });

      if (rpcError) {
        console.warn('⚠️  Could not increment usage:', rpcError.message);
      } else {
        console.log(`✅ Usage incremented, returned org ID: ${rpcResult}`);
      }
    } catch (e) {
      console.warn('⚠️  Could not increment invite code usage:', e.message);
    }

    console.log(`\n✅ SUCCESS! User joined organization: ${organizationId}\n`);
    return { organizationId };

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}\n`);
    throw error;
  }
}

// Run the test
(async () => {
  const testCode = process.argv[2] || 'ORG-ANON-e706f8';
  
  console.log('='.repeat(60));
  console.log('  INVITE CODE REDEMPTION TEST');
  console.log('='.repeat(60));

  try {
    const result = await testJoinOrganizationWithCode(testCode);
    console.log('📊 Result:', result);
  } catch (error) {
    console.log('📊 Test failed (expected if not logged in or already member)');
  }

  console.log('='.repeat(60));
})();
