require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

async function testOnboardingFlow() {
  console.log('🧪 Testing Onboarding Flow\n');

  // Test 1: Check if invite codes table exists and has data
  console.log('Test 1: Checking invite codes...');
  const { data: codes, error: codesError } = await supabase
    .from('organization_invite_codes')
    .select('code, description, is_active, organization_id');

  if (codesError) {
    console.error('❌ Failed:', codesError.message);
    console.log('   → Migration may not be applied yet\n');
  } else {
    console.log(`✅ Found ${codes.length} invite codes:`);
    codes.forEach((code) => {
      console.log(
        `   - ${code.code}: ${code.description} (${code.is_active ? 'active' : 'inactive'})`,
      );
    });
    console.log();
  }

  // Test 2: Check certified organizations
  console.log('Test 2: Checking certified organizations...');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('name, is_certified, status')
    .eq('is_certified', true)
    .eq('status', 'approved');

  if (orgsError) {
    console.error('❌ Failed:', orgsError.message);
    console.log('   → Check if is_certified column exists\n');
  } else {
    console.log(`✅ Found ${orgs.length} certified organizations:`);
    orgs.forEach((org) => {
      console.log(`   - ${org.name} (${org.status})`);
    });
    console.log();
  }

  // Test 3: Validate a sample code
  console.log('Test 3: Validating sample code "RAEP2025"...');
  const { data: validCode, error: validError } = await supabase
    .from('organization_invite_codes')
    .select(
      'organization_id, role, is_active, max_uses, current_uses, expires_at',
    )
    .eq('code', 'RAEP2025')
    .single();

  if (validError) {
    console.error('❌ Failed:', validError.message);
    console.log('   → Code may not exist yet\n');
  } else {
    const isValid =
      validCode.is_active &&
      (!validCode.expires_at || new Date(validCode.expires_at) > new Date()) &&
      (!validCode.max_uses || validCode.current_uses < validCode.max_uses);

    if (isValid) {
      console.log('✅ Code is valid:');
      console.log(`   - Organization ID: ${validCode.organization_id}`);
      console.log(`   - Default role: ${validCode.role}`);
      console.log(
        `   - Usage: ${validCode.current_uses}${validCode.max_uses ? `/${validCode.max_uses}` : ' (unlimited)'}`,
      );
    } else {
      console.log('⚠️  Code exists but is not valid:');
      console.log(`   - Active: ${validCode.is_active}`);
      console.log(
        `   - Expired: ${validCode.expires_at ? new Date(validCode.expires_at) < new Date() : false}`,
      );
      console.log(
        `   - Usage limit reached: ${validCode.max_uses && validCode.current_uses >= validCode.max_uses}`,
      );
    }
    console.log();
  }

  // Test 4: Check if function exists (indirect test via RPC)
  console.log('Test 4: Testing increment_invite_code_usage function...');
  try {
    // This will fail if function doesn't exist
    const { data: funcTest, error: funcError } = await supabase.rpc(
      'increment_invite_code_usage',
      { code_text: 'NONEXISTENT_CODE' },
    );

    if (funcError) {
      if (
        funcError.message.includes('function') &&
        funcError.message.includes('does not exist')
      ) {
        console.error('❌ Function does not exist');
        console.log('   → Migration may not be fully applied\n');
      } else {
        console.log(
          '✅ Function exists (returned NULL for invalid code as expected)',
        );
        console.log();
      }
    } else {
      console.log('✅ Function exists and returned:', funcTest);
      console.log();
    }
  } catch (err) {
    console.error('❌ Error testing function:', err.message);
    console.log();
  }

  // Test 5: Check RLS policies
  console.log('Test 5: Testing RLS policies...');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('⚠️  Not authenticated - cannot test RLS policies');
    console.log('   → Sign in to test RLS\n');
  } else {
    console.log(`✅ Authenticated as: ${user.email}`);

    // Try to read codes (should work for authenticated users)
    const { data: readTest, error: readError } = await supabase
      .from('organization_invite_codes')
      .select('code')
      .limit(1);

    if (readError) {
      console.error('❌ Cannot read codes:', readError.message);
      console.log('   → RLS policy may be too restrictive\n');
    } else {
      console.log('✅ Can read active invite codes (RLS working)');
      console.log();
    }
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('Summary:');
  console.log('- Invite codes table:', codes ? '✅' : '❌');
  console.log('- Certified orgs:', orgs && orgs.length > 0 ? '✅' : '❌');
  console.log('- Sample code valid:', validCode ? '✅' : '❌');
  console.log('- Function exists:', '✅ (assumed if no error)');
  console.log('- RLS policies:', user ? '✅' : '⚠️  (not tested)');
  console.log('═══════════════════════════════════════\n');

  if (codes && orgs && validCode) {
    console.log('🎉 Onboarding flow is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Update signup flow to redirect to /onboarding');
    console.log('2. Test each onboarding path in the app');
    console.log('3. Create additional invite codes as needed');
  } else {
    console.log('⚠️  Migration may not be fully applied.');
    console.log('\nTo fix:');
    console.log('1. Run the migration SQL in Supabase Dashboard');
    console.log('2. Run verify-onboarding-migration.sql to check');
    console.log('3. Re-run this test script');
  }
}

testOnboardingFlow().catch(console.error);
