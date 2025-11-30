/**
 * OUTREACH LOGS FUNCTIONAL TESTING
 * 
 * Tests CRUD operations and RLS enforcement for outreach_logs table
 * with multiple test users from different organizations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Test user credentials - UPDATE THESE
const TEST_USERS = {
  raep: {
    email: 'achavez@recoveryalliance.net',
    password: 'TestPassword123!', // UPDATE THIS
    label: 'RAEP User',
    expectedOrg: 'recovery-alliance-el-paso'
  },
  haven: {
    email: 'test@haven-ai.org',
    password: 'TestPassword123!', // UPDATE THIS
    label: 'Haven AI User',
    expectedOrg: 'anonymous-haven-ai'
  }
};

interface TestResult {
  operation: string;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

class OutreachLogsTester {
  private client: SupabaseClient;
  private results: TestResult[] = [];

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  private log(result: TestResult) {
    this.results.push(result);
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.operation}: ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error.message || JSON.stringify(result.error)}`);
    }
    if (result.data) {
      console.log(`   Data:`, JSON.stringify(result.data, null, 2));
    }
  }

  async testUser(userConfig: typeof TEST_USERS.raep) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing: ${userConfig.label}`);
    console.log(`📧 Email: ${userConfig.email}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // 1. Sign in
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
        email: userConfig.email,
        password: userConfig.password,
      });

      if (authError || !authData.user) {
        this.log({
          operation: 'Sign In',
          success: false,
          message: 'Authentication failed',
          error: authError
        });
        return;
      }

      this.log({
        operation: 'Sign In',
        success: true,
        message: `Authenticated as ${authData.user.email}`,
        data: { user_id: authData.user.id }
      });

      const userId = authData.user.id;

      // 2. Get user's organization context
      const { data: memberships, error: memberError } = await this.client
        .from('user_organizations')
        .select(`
          id,
          role,
          is_active,
          organization_id,
          organizations!inner(
            id,
            name,
            slug,
            outreach_enabled
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (memberError) {
        this.log({
          operation: 'Get Organization Context',
          success: false,
          message: 'Failed to fetch user organizations',
          error: memberError
        });
        return;
      }

      if (!memberships || memberships.length === 0) {
        this.log({
          operation: 'Get Organization Context',
          success: false,
          message: 'User has no active organization memberships'
        });
        return;
      }

      this.log({
        operation: 'Get Organization Context',
        success: true,
        message: `User belongs to ${memberships.length} organization(s)`,
        data: memberships.map((m: any) => ({
          org: m.organizations.name,
          slug: m.organizations.slug,
          role: m.role,
          outreach_enabled: m.organizations.outreach_enabled
        }))
      });

      const primaryOrg = memberships[0];
      const orgId = primaryOrg.organization_id;

      // 3. Test SELECT - Read existing logs
      const { data: existingLogs, error: selectError } = await this.client
        .from('outreach_logs')
        .select('*')
        .limit(5);

      if (selectError) {
        this.log({
          operation: 'SELECT outreach_logs',
          success: false,
          message: 'Read denied by RLS',
          error: selectError
        });
      } else {
        this.log({
          operation: 'SELECT outreach_logs',
          success: true,
          message: `Read ${existingLogs?.length || 0} logs`,
          data: {
            count: existingLogs?.length,
            org_ids: [...new Set(existingLogs?.map(l => l.organization_id) || [])]
          }
        });
      }

      // 4. Test INSERT - Create a new log
      const testLog = {
        organization_id: orgId,
        user_id: userId,
        outreach_date: new Date().toISOString().split('T')[0],
        zip_code: '79901',
        location: 'Test Location',
        kit_types: ['Narcan'],
        num_kits: 1,
        people_reached: 2,
        trip_count: 1,
        males_reached: 1,
        females_reached: 1,
        notes: `Test log from ${userConfig.label} at ${new Date().toISOString()}`
      };

      const { data: insertedLog, error: insertError } = await this.client
        .from('outreach_logs')
        .insert([testLog])
        .select()
        .single();

      if (insertError) {
        this.log({
          operation: 'INSERT outreach_logs',
          success: false,
          message: 'Insert denied by RLS',
          error: insertError
        });
        return; // Can't continue without a log to update/delete
      }

      this.log({
        operation: 'INSERT outreach_logs',
        success: true,
        message: `Created log ID: ${insertedLog.id}`,
        data: {
          id: insertedLog.id,
          organization_id: insertedLog.organization_id,
          user_id: insertedLog.user_id
        }
      });

      const logId = insertedLog.id;

      // 5. Test UPDATE - Modify the log we just created
      const { data: updatedLog, error: updateError } = await this.client
        .from('outreach_logs')
        .update({
          notes: `${testLog.notes} (UPDATED)`,
          people_reached: 3
        })
        .eq('id', logId)
        .select()
        .single();

      if (updateError) {
        this.log({
          operation: 'UPDATE outreach_logs',
          success: false,
          message: 'Update denied by RLS',
          error: updateError
        });
      } else {
        this.log({
          operation: 'UPDATE outreach_logs',
          success: true,
          message: `Updated log ID: ${logId}`,
          data: {
            people_reached: updatedLog.people_reached,
            notes_updated: updatedLog.notes.includes('UPDATED')
          }
        });
      }

      // 6. Test DELETE - Remove the test log
      const { error: deleteError } = await this.client
        .from('outreach_logs')
        .delete()
        .eq('id', logId);

      if (deleteError) {
        this.log({
          operation: 'DELETE outreach_logs',
          success: false,
          message: 'Delete denied (expected for non-admins)',
          error: deleteError
        });
      } else {
        this.log({
          operation: 'DELETE outreach_logs',
          success: true,
          message: `Deleted log ID: ${logId}`
        });
      }

      // 7. Test cross-org access - Try to read another org's data
      const { data: allOrgs } = await this.client
        .from('organizations')
        .select('id, name, slug')
        .neq('id', orgId)
        .limit(1);

      if (allOrgs && allOrgs.length > 0) {
        const otherOrgId = allOrgs[0].id;
        
        const { data: crossOrgLogs, error: crossOrgError } = await this.client
          .from('outreach_logs')
          .select('*')
          .eq('organization_id', otherOrgId)
          .limit(1);

        if (crossOrgError) {
          this.log({
            operation: 'Cross-Org Access Test',
            success: true,
            message: `✅ Cross-org access properly blocked`,
            error: crossOrgError
          });
        } else if (!crossOrgLogs || crossOrgLogs.length === 0) {
          this.log({
            operation: 'Cross-Org Access Test',
            success: true,
            message: `✅ Cross-org access filtered (no results returned)`
          });
        } else {
          this.log({
            operation: 'Cross-Org Access Test',
            success: false,
            message: `🚨 SECURITY ISSUE: User can see other org's data!`,
            data: {
              other_org_id: otherOrgId,
              logs_seen: crossOrgLogs.length
            }
          });
        }
      } else {
        this.log({
          operation: 'Cross-Org Access Test',
          success: true,
          message: 'No other organizations to test with'
        });
      }

    } catch (error: any) {
      this.log({
        operation: 'Fatal Error',
        success: false,
        message: error.message,
        error
      });
    } finally {
      // Sign out
      await this.client.auth.signOut();
      console.log(`\n🚪 Signed out ${userConfig.label}\n`);
    }
  }

  async runAllTests() {
    console.log('🚀 OUTREACH LOGS FUNCTIONAL TESTING SUITE');
    console.log('==========================================\n');
    console.log('⚠️  Make sure to update TEST_USERS credentials!\n');

    for (const [key, userConfig] of Object.entries(TEST_USERS)) {
      await this.testUser(userConfig);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log(`\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${this.results.length}\n`);

    // Show critical failures
    const criticalFailures = this.results.filter(r => 
      !r.success && 
      !r.operation.includes('DELETE') && // DELETE failures are expected for non-admins
      !r.operation.includes('Cross-Org') // Cross-org blocks are good
    );

    if (criticalFailures.length > 0) {
      console.log('🚨 CRITICAL FAILURES:\n');
      criticalFailures.forEach(f => {
        console.log(`   - ${f.operation}: ${f.message}`);
      });
      console.log('');
    }
  }
}

// Run tests
const tester = new OutreachLogsTester();
tester.runAllTests().catch(console.error);
