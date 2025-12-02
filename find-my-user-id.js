const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vitwypicporqpeefwsjs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMyUserId() {
  try {
    console.log('Getting current user...\n');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Error:', error.message);
      console.log(
        '\nYou need to be logged in. Please log in through the app first.',
      );
      return;
    }

    if (!user) {
      console.log('No user logged in. Please log in through the app first.');
      return;
    }

    console.log('✅ Found your user!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Created:', new Date(user.created_at).toLocaleString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check current organization membership
    const { data: membership } = await supabase
      .from('user_organizations')
      .select(
        `
        role,
        is_active,
        organizations (
          name,
          slug
        )
      `,
      )
      .eq('user_id', user.id)
      .single();

    if (membership) {
      console.log('Current Organization Membership:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Organization:', membership.organizations?.name);
      console.log('Slug:', membership.organizations?.slug);
      console.log('Role:', membership.role);
      console.log('Active:', membership.is_active);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('⚠️  No organization membership found.\n');
    }

    console.log('📋 To set up your profile, run this SQL in Supabase:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
INSERT INTO user_organizations (user_id, organization_id, role, is_active)
VALUES (
  '${user.id}',
  (SELECT id FROM organizations WHERE slug = 'recovery-alliance-el-paso'),
  'peer',
  true
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET
  role = 'peer',
  is_active = true,
  updated_at = now();
    `);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

findMyUserId();
