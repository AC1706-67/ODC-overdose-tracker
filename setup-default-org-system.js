require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDefaultOrgSystem() {
  console.log('🚀 Setting up default organization system...\n');

  try {
    // Step 1: Create Haven AI organization
    console.log('📝 Step 1: Creating Haven AI organization...');
    const { data: havenOrg, error: orgError } = await supabase
      .from('organizations')
      .upsert(
        {
          slug: 'haven-ai',
          name: 'Haven AI',
          is_active: true,
          outreach_enabled: false,
          is_certified: true,
        },
        { onConflict: 'slug' },
      )
      .select()
      .single();

    if (orgError) {
      console.error('❌ Error creating Haven AI org:', orgError);
    } else {
      console.log('✅ Haven AI organization created:', havenOrg.id);
    }

    // Step 2: Create the trigger function
    console.log('\n📝 Step 2: Creating auto-assign trigger function...');
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
      RETURNS TRIGGER AS $$
      DECLARE
        default_org_id UUID;
      BEGIN
        SELECT id INTO default_org_id
        FROM public.organizations
        WHERE slug = 'haven-ai'
        LIMIT 1;

        IF default_org_id IS NOT NULL THEN
          INSERT INTO public.user_organizations (
            user_id,
            organization_id,
            role,
            is_active
          )
          VALUES (
            NEW.id,
            default_org_id,
            'member',
            true
          )
          ON CONFLICT (user_id, organization_id) DO NOTHING;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: funcError } = await supabase.rpc('exec_sql', {
      sql: triggerFunction,
    });
    if (funcError) {
      console.log(
        '⚠️  Note: exec_sql RPC might not exist. Run the SQL manually in Supabase SQL Editor.',
      );
      console.log('SQL to run:\n', triggerFunction);
    } else {
      console.log('✅ Trigger function created');
    }

    // Step 3: Create the trigger
    console.log('\n📝 Step 3: Creating trigger...');
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created_assign_org ON auth.users;
      
      CREATE TRIGGER on_auth_user_created_assign_org
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.auto_assign_default_organization();
    `;

    console.log('⚠️  Run this SQL in Supabase SQL Editor:\n', triggerSQL);

    // Step 4: Find and assign Chavez user to RAEP
    console.log('\n📝 Step 4: Finding Chavez user...');
    const { data: users, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Error listing users:', userError);
    } else {
      const chavezUser = users.users.find((u) =>
        u.email?.toLowerCase().includes('chavez'),
      );

      if (chavezUser) {
        console.log('✅ Found Chavez user:', chavezUser.email, chavezUser.id);

        // Find RAEP org
        const { data: raepOrg, error: raepError } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .or(
            'slug.eq.recovery-alliance-el-paso,name.ilike.%recovery%alliance%',
          )
          .limit(1)
          .single();

        if (raepOrg) {
          console.log('✅ Found RAEP org:', raepOrg.name, raepOrg.id);

          // Remove from Haven AI
          await supabase
            .from('user_organizations')
            .delete()
            .eq('user_id', chavezUser.id)
            .eq('organization_id', havenOrg.id);

          // Assign to RAEP
          const { error: assignError } = await supabase
            .from('user_organizations')
            .upsert(
              {
                user_id: chavezUser.id,
                organization_id: raepOrg.id,
                role: 'admin',
                is_active: true,
              },
              { onConflict: 'user_id,organization_id' },
            );

          if (assignError) {
            console.error('❌ Error assigning to RAEP:', assignError);
          } else {
            console.log('✅ Assigned Chavez to RAEP as admin');
          }
        } else {
          console.log('⚠️  RAEP organization not found');
        }
      } else {
        console.log('⚠️  Chavez user not found');
      }
    }

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Summary:');
    console.log('- Haven AI organization created as default');
    console.log('- New users will auto-join Haven AI');
    console.log('- Existing Chavez user assigned to RAEP');
    console.log(
      '\n⚠️  IMPORTANT: Run the trigger SQL manually in Supabase SQL Editor (shown above)',
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupDefaultOrgSystem();
