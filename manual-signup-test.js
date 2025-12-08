/**
 * MANUAL SIGNUP TEST
 * 
 * This script simulates what app/signup.tsx does to test the signup flow
 * without needing to use the mobile app.
 * 
 * Usage:
 * 1. Set your Supabase credentials in .env file
 * 2. Run: node manual-signup-test.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Need: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  // Generate unique test email with random component
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const email = `test-${timestamp}-${random}@example.com`;
  const password = 'TestPassword123!';
  const now = new Date().toISOString();

  console.log('\n🧪 Testing Signup Flow');
  console.log('='.repeat(60));
  console.log(`📧 Test Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Create auth user
    console.log('\n[Step 1] Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          terms_accepted_at: now,
          privacy_accepted_at: now,
          accepted_version: '1.0',
        },
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from signUp');
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Get default organization
    console.log('\n[Step 2] Finding default organization...');
    const { data: defaultOrg, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'anonymous-haven-ai')
      .single();

    if (orgError || !defaultOrg) {
      console.error('❌ Default org not found:', orgError?.message || 'No org found');
      console.error('   Run: ensure-default-org-exists.sql in Supabase SQL Editor');
      return;
    }

    console.log('✅ Found default org:', defaultOrg.name);

    // Step 3: Create profile (upsert for idempotency)
    console.log('\n[Step 3] Creating profile (upsert)...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          email: email,
          terms_accepted_at: now,
          privacy_accepted_at: now,
          accepted_version: '1.0',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('❌ Profile upsert error:', profileError.message);
      console.error('   Check RLS policies on profiles table');
      return;
    }

    console.log('✅ Profile created/updated');

    // Step 4: Assign to organization (upsert for idempotency)
    console.log('\n[Step 4] Assigning to organization (upsert)...');
    const { error: membershipError } = await supabase
      .from('user_organizations')
      .upsert(
        {
          user_id: authData.user.id,
          organization_id: defaultOrg.id,
          role: 'Responder',
          is_active: true,
        },
        { onConflict: 'user_id,organization_id' }
      );

    if (membershipError) {
      console.error('❌ Membership upsert error:', membershipError.message);
      console.error('   Check RLS policies on user_organizations table');
      console.error('   Note: upsert requires both INSERT and UPDATE policies');
      
      // Fallback to regular insert if upsert fails
      console.log('\n   Trying regular INSERT as fallback...');
      const { error: insertError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: authData.user.id,
          organization_id: defaultOrg.id,
          role: 'Responder',
          is_active: true,
        });
      
      if (insertError) {
        if (insertError.message.includes('duplicate key')) {
          console.log('✅ Org membership already exists (OK)');
        } else {
          console.error('❌ Insert also failed:', insertError.message);
          return;
        }
      } else {
        console.log('✅ User assigned to org (via INSERT)');
      }
    } else {
      console.log('✅ User assigned to org');
    }

    console.log('✅ User assigned to org');

    // Step 5: Verify the signup
    console.log('\n[Step 5] Verifying signup...');
    
    // Sign in to test
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful');

    // Check profile
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileCheckError || !profile) {
      console.error('❌ Profile not found:', profileCheckError?.message);
      return;
    }

    console.log('✅ Profile exists');

    // Check org membership (future-proof for multi-org)
    const { data: memberships, error: membershipCheckError } = await supabase
      .from('user_organizations')
      .select('*, organizations(name, slug)')
      .eq('user_id', authData.user.id);

    if (membershipCheckError || !memberships || memberships.length === 0) {
      console.error('❌ Org membership not found:', membershipCheckError?.message);
      return;
    }

    const primaryMembership = memberships[0];
    console.log('✅ Org membership exists:', primaryMembership.organizations.name);
    if (memberships.length > 1) {
      console.log(`   (User has ${memberships.length} org memberships)`);
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SIGNUP TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Organization: ${primaryMembership.organizations.name}`);
    console.log(`   Role: ${primaryMembership.role}`);
    console.log('\n✅ All 4 steps completed successfully');
    console.log('✅ User can sign in');
    console.log('✅ Profile exists');
    console.log('✅ Org membership exists');
    console.log('\n💡 You can now test login in the app with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

    // Clean up - sign out
    await supabase.auth.signOut();

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error(err);
  }
}

// Run the test
testSignup().catch(console.error);
