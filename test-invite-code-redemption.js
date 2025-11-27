/**
 * Test script for invite code redemption
 * 
 * Usage:
 * 1. Update the testCode with a real invite code from your database
 * 2. Make sure you're logged in (or update to use service role)
 * 3. Run: node test-invite-code-redemption.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testInviteCodeRedemption() {
  try {
    console.log('🧪 Testing Invite Code Redemption\n');

    // Test code - replace with a real code from your database
    const testCode = 'ORG-ANON-e706f8';

    console.log(`📝 Testing with code: ${testCode}\n`);

    // Step 1: Check if the code exists
    console.log('1️⃣ Checking if invite code exists...');
    const { data: invite, error: inviteError } = await supabase
      .from('organization_invite_codes')
      .select('*')
      .eq('code', testCode.toUpperCase())
      .maybeSingle();

    if (inviteError) {
      console.error('❌ Error looking up invite code:', inviteError);
      return;
    }

    if (!invite) {
      console.error('❌ Invite code not found in database');
      console.log('\n💡 To create a test invite code, run:');
      console.log('   See generate-invite-code.sql');
      return;
    }

    console.log('✅ Invite code found:');
    console.log(`   Organization ID: ${invite.organization_id}`);
    console.log(`   Role: ${invite.role}`);
    console.log(`   Active: ${invite.is_active}`);
    console.log(`   Uses: ${invite.current_uses}/${invite.max_uses || '∞'}`);
    console.log(`   Expires: ${invite.expires_at || 'Never'}\n`);

    // Step 2: Get organization details
    console.log('2️⃣ Getting organization details...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, is_active, is_certified')
      .eq('id', invite.organization_id)
      .single();

    if (orgError) {
      console.error('❌ Error getting organization:', orgError);
      return;
    }

    console.log('✅ Organization found:');
    console.log(`   Name: ${org.name}`);
    console.log(`   Slug: ${org.slug}`);
    console.log(`   Active: ${org.is_active}`);
    console.log(`   Certified: ${org.is_certified}\n`);

    // Step 3: Check current user
    console.log('3️⃣ Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ No user logged in');
      console.log('\n💡 You need to be logged in to test redemption');
      console.log('   This test requires an authenticated user session');
      return;
    }

    console.log('✅ User authenticated:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}\n`);

    // Step 4: Check if already a member
    console.log('4️⃣ Checking existing membership...');
    const { data: existingMembership } = await supabase
      .from('user_organizations')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('organization_id', invite.organization_id)
      .maybeSingle();

    if (existingMembership) {
      console.log('⚠️  User is already a member:');
      console.log(`   Role: ${existingMembership.role}`);
      console.log(`   Active: ${existingMembership.is_active}\n`);
      console.log('💡 Redemption would fail with "already a member" error');
      return;
    }

    console.log('✅ User is not yet a member\n');

    // Step 5: Test the redemption
    console.log('5️⃣ Testing invite code redemption...');
    console.log('   (This will actually add the user to the organization)\n');

    // Import the actual function
    // Note: This won't work in Node.js without proper setup
    // You'll need to test this in the actual app or use the API directly

    console.log('📋 To test redemption, use this code in your app:');
    console.log(`
import { joinOrganizationWithCode } from '@/src/api/organizationOnboarding';

try {
  const result = await joinOrganizationWithCode('${testCode}');
  console.log('✅ Success:', result);
  // result = { organizationId: '...' }
} catch (error) {
  console.error('❌ Error:', error.message);
}
    `);

    // Alternative: Test the RPC function directly
    console.log('\n6️⃣ Testing increment_invite_code_usage RPC...');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('increment_invite_code_usage', { code: testCode.toUpperCase() });

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
    } else {
      console.log('✅ RPC Success:');
      console.log(`   Returned org ID: ${rpcResult}`);
      console.log(`   (Usage counter incremented)\n`);
    }

    // Step 7: Verify the increment
    console.log('7️⃣ Verifying usage counter...');
    const { data: updatedInvite } = await supabase
      .from('organization_invite_codes')
      .select('current_uses')
      .eq('code', testCode.toUpperCase())
      .single();

    if (updatedInvite) {
      console.log(`✅ Current uses: ${updatedInvite.current_uses}\n`);
    }

    console.log('✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testInviteCodeRedemption();
