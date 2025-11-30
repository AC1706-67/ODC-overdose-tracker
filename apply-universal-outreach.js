/**
 * ENABLE OUTREACH FOR ALL ORGANIZATIONS
 * 
 * Applies universal outreach access - everyone gets it, no restrictions.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function enableUniversalOutreach() {
  console.log('🚀 ENABLING UNIVERSAL OUTREACH ACCESS\n');
  console.log('Policy: Everyone who onboards gets outreach access');
  console.log('No more restrictions or gatekeeping\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get current state
    console.log('\n📊 Current State:');
    const { data: beforeOrgs, error: beforeError } = await supabase
      .from('organizations')
      .select('id, name, slug, outreach_enabled, is_active');

    if (beforeError) {
      console.error('❌ Error fetching organizations:', beforeError.message);
      return;
    }

    console.log(`Total organizations: ${beforeOrgs.length}`);
    console.log(`With outreach enabled: ${beforeOrgs.filter(o => o.outreach_enabled).length}`);
    console.log(`Without outreach: ${beforeOrgs.filter(o => !o.outreach_enabled).length}\n`);

    if (beforeOrgs.length === 0) {
      console.log('⚠️  No organizations found. Create organizations first.');
      return;
    }

    // Step 2: Enable outreach for all
    console.log('🔧 Enabling outreach for all organizations...');
    
    const orgsToUpdate = beforeOrgs.filter(o => !o.outreach_enabled);
    
    if (orgsToUpdate.length === 0) {
      console.log('✅ All organizations already have outreach enabled!');
    } else {
      for (const org of orgsToUpdate) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ 
            outreach_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', org.id);

        if (updateError) {
          console.error(`❌ Failed to update ${org.name}:`, updateError.message);
        } else {
          console.log(`✅ Enabled outreach for: ${org.name} (${org.slug})`);
        }
      }
    }

    // Step 3: Verify final state
    console.log('\n📊 Final State:');
    const { data: afterOrgs, error: afterError } = await supabase
      .from('organizations')
      .select('id, name, slug, outreach_enabled, is_active')
      .order('name');

    if (afterError) {
      console.error('❌ Error verifying changes:', afterError.message);
      return;
    }

    console.table(afterOrgs.map(o => ({
      name: o.name,
      slug: o.slug,
      outreach: o.outreach_enabled ? '✅ Yes' : '❌ No',
      active: o.is_active ? '✅ Yes' : '❌ No'
    })));

    const allEnabled = afterOrgs.every(o => o.outreach_enabled);
    
    console.log('\n' + '='.repeat(60));
    if (allEnabled) {
      console.log('🎉 SUCCESS: All organizations have outreach enabled!');
      console.log('✅ New users will have outreach access immediately');
      console.log('✅ No more gatekeeping or restrictions');
    } else {
      console.log('⚠️  WARNING: Some organizations still lack outreach access');
      console.log('Run this script again or check database permissions');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

// Run it
enableUniversalOutreach().catch(console.error);
