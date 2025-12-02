/**
 * END-TO-END TESTFLIGHT READINESS CHECK
 *
 * This script validates that all critical functionality works before TestFlight build:
 * - Authentication
 * - Organization membership
 * - Outreach logs CRUD
 * - Incidents CRUD
 * - RLS policy enforcement
 *
 * Usage:
 * 1. Set TEST_EMAIL and TEST_PASSWORD environment variables
 * 2. Run: npx tsx scripts/end-to-end-checklist-test.ts
 */

import { supabase } from '../src/lib/supabase';
import * as dotenv from 'dotenv';

dotenv.config();

// Test credentials - set these as environment variables
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

interface TestResult {
  step: string;
  status: 'OK' | 'FAILED';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(
  step: string,
  status: 'OK' | 'FAILED',
  message: string,
  data?: any,
) {
  results.push({ step, status, message, data });
  const icon = status === 'OK' ? '✅' : '❌';
  console.log(`${icon} ${step}: ${status}`);
  if (message) console.log(`   ${message}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2));
}

async function runEndToEndTest() {
  console.log('🚀 TESTFLIGHT READINESS CHECK');
  console.log('='.repeat(60));
  console.log('');

  let userId: string | undefined;
  let organizationId: string | undefined;
  let organizationName: string | undefined;
  let outreachLogId: string | undefined;
  let incidentId: string | undefined;

  try {
    // ========================================================================
    // STEP 1: AUTHENTICATION
    // ========================================================================
    console.log('1️⃣ Testing Authentication...');

    if (!TEST_EMAIL || !TEST_PASSWORD) {
      logResult(
        'LOGIN',
        'FAILED',
        'TEST_EMAIL or TEST_PASSWORD not set in environment',
      );
      throw new Error('Missing test credentials');
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

    if (authError || !authData.user) {
      logResult('LOGIN', 'FAILED', authError?.message || 'No user returned');
      throw new Error('Authentication failed');
    }

    userId = authData.user.id;
    logResult('LOGIN', 'OK', `Authenticated as ${authData.user.email}`, {
      user_id: userId,
    });

    // ========================================================================
    // STEP 2: ORGANIZATION MEMBERSHIP
    // ========================================================================
    console.log('\n2️⃣ Testing Organization Membership...');

    const { data: memberships, error: memberError } = await supabase
      .from('user_organizations')
      .select(
        `
        id,
        role,
        is_active,
        organization_id,
        organizations!inner(
          id,
          name,
          slug,
          outreach_enabled,
          is_active
        )
      `,
      )
      .eq('user_id', userId)
      .eq('is_active', true);

    if (memberError) {
      logResult('ORG_MEMBERSHIP', 'FAILED', memberError.message);
      throw new Error('Failed to fetch organization membership');
    }

    if (!memberships || memberships.length === 0) {
      logResult(
        'ORG_MEMBERSHIP',
        'FAILED',
        'User has no active organization memberships',
      );
      throw new Error('No organization membership');
    }

    const firstMembership = memberships[0] as any;
    organizationId = firstMembership.organization_id;
    organizationName = firstMembership.organizations.name;

    logResult(
      'ORG_MEMBERSHIP',
      'OK',
      `User belongs to ${memberships.length} organization(s)`,
      {
        primary_org: organizationName,
        org_id: organizationId,
        role: firstMembership.role,
        outreach_enabled: firstMembership.organizations.outreach_enabled,
      },
    );

    // ========================================================================
    // STEP 3: OUTREACH LOG INSERT
    // ========================================================================
    console.log('\n3️⃣ Testing Outreach Log Insert...');

    const outreachLogData = {
      organization_id: organizationId,
      user_id: userId,
      outreach_date: new Date().toISOString().split('T')[0],
      zip_code: '79901',
      location: 'TestFlight Test Location',
      kit_types: ['Narcan'],
      num_kits: 1,
      people_reached: 2,
      trip_count: 1,
      males_reached: 1,
      females_reached: 1,
      notes: `End-to-end outreach test log - ${new Date().toISOString()}`,
    };

    const { data: insertedOutreach, error: outreachInsertError } =
      await supabase
        .from('outreach_logs')
        .insert([outreachLogData])
        .select()
        .single();

    if (outreachInsertError) {
      logResult('OUTREACH_INSERT', 'FAILED', outreachInsertError.message);
      throw new Error('Outreach log insert failed');
    }

    outreachLogId = insertedOutreach.id;
    logResult('OUTREACH_INSERT', 'OK', 'Outreach log created successfully', {
      id: outreachLogId,
      organization_id: insertedOutreach.organization_id,
      zip_code: insertedOutreach.zip_code,
    });

    // ========================================================================
    // STEP 4: OUTREACH LOG SELECT
    // ========================================================================
    console.log('\n4️⃣ Testing Outreach Log Select...');

    const { data: selectedOutreach, error: outreachSelectError } =
      await supabase
        .from('outreach_logs')
        .select('*')
        .eq('id', outreachLogId)
        .single();

    if (outreachSelectError) {
      logResult('OUTREACH_SELECT', 'FAILED', outreachSelectError.message);
      throw new Error('Outreach log select failed');
    }

    logResult('OUTREACH_SELECT', 'OK', 'Outreach log retrieved successfully', {
      id: selectedOutreach.id,
      notes: selectedOutreach.notes,
    });

    // ========================================================================
    // STEP 5: INCIDENT INSERT
    // ========================================================================
    console.log('\n5️⃣ Testing Incident Insert...');

    const incidentData = {
      organization_id: organizationId,
      created_by: userId,
      incident_date: new Date().toISOString().split('T')[0],
      zip_code: '79901',
      location: 'TestFlight Test Location',
      outcome: 'survived',
      naloxone_given: true,
      notes: `End-to-end incident test - ${new Date().toISOString()}`,
    };

    const { data: insertedIncident, error: incidentInsertError } =
      await supabase.from('incidents').insert([incidentData]).select().single();

    if (incidentInsertError) {
      logResult('INCIDENT_INSERT', 'FAILED', incidentInsertError.message);
      throw new Error('Incident insert failed');
    }

    incidentId = insertedIncident.id;
    logResult('INCIDENT_INSERT', 'OK', 'Incident created successfully', {
      id: incidentId,
      organization_id: insertedIncident.organization_id,
      outcome: insertedIncident.outcome,
    });

    // ========================================================================
    // STEP 6: INCIDENT SELECT
    // ========================================================================
    console.log('\n6️⃣ Testing Incident Select...');

    const { data: selectedIncident, error: incidentSelectError } =
      await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

    if (incidentSelectError) {
      logResult('INCIDENT_SELECT', 'FAILED', incidentSelectError.message);
      throw new Error('Incident select failed');
    }

    logResult('INCIDENT_SELECT', 'OK', 'Incident retrieved successfully', {
      id: selectedIncident.id,
      notes: selectedIncident.notes,
    });

    // ========================================================================
    // STEP 7: RLS ISOLATION TEST (Cross-org access should be blocked)
    // ========================================================================
    console.log('\n7️⃣ Testing RLS Isolation...');

    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name')
      .neq('id', organizationId)
      .limit(1);

    if (allOrgs && allOrgs.length > 0) {
      const otherOrgId = allOrgs[0].id;

      const { data: crossOrgLogs, error: crossOrgError } = await supabase
        .from('outreach_logs')
        .select('*')
        .eq('organization_id', otherOrgId)
        .limit(1);

      if (crossOrgError || !crossOrgLogs || crossOrgLogs.length === 0) {
        logResult('RLS_ISOLATION', 'OK', 'Cross-org access properly blocked');
      } else {
        logResult(
          'RLS_ISOLATION',
          'FAILED',
          `SECURITY ISSUE: User can see other org's data!`,
          {
            other_org_id: otherOrgId,
            logs_seen: crossOrgLogs.length,
          },
        );
      }
    } else {
      logResult(
        'RLS_ISOLATION',
        'OK',
        'No other organizations to test with (single org setup)',
      );
    }

    // ========================================================================
    // CLEANUP: Delete test data
    // ========================================================================
    console.log('\n8️⃣ Cleaning up test data...');

    if (outreachLogId) {
      await supabase.from('outreach_logs').delete().eq('id', outreachLogId);
      console.log('   Deleted test outreach log');
    }

    if (incidentId) {
      await supabase.from('incidents').delete().eq('id', incidentId);
      console.log('   Deleted test incident');
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.status === 'OK').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;

    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${results.length}\n`);

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED - READY FOR TESTFLIGHT BUILD!');
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  SOME TESTS FAILED - FIX ISSUES BEFORE TESTFLIGHT BUILD');
      console.log('\nFailed tests:');
      results
        .filter((r) => r.status === 'FAILED')
        .forEach((r) => {
          console.log(`   - ${r.step}: ${r.message}`);
        });
      console.log('');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST SUITE FAILED');
    console.log('='.repeat(60));
    console.log(
      '\nFix the errors above before proceeding with TestFlight build.\n',
    );
    process.exit(1);
  } finally {
    // Always sign out
    await supabase.auth.signOut();
  }
}

// Run the test
runEndToEndTest();
