#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const config = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://vitwypicporqpeefwsjs.supabase.co',
  supabaseKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI',
};

async function analyzeSchema() {
  console.log('🔍 Analyzing current Supabase database schema...\n');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  const analysis = {
    tables: {},
    views: {},
    missing: [],
    recommendations: [],
  };

  // Define what we expect to have
  const expectedTables = {
    organizations: {
      columns: ['id', 'name', 'created_at'],
      description: 'Organization management',
    },
    team_members: {
      columns: [
        'id',
        'organization_id',
        'name',
        'email',
        'role',
        'is_active',
        'created_at',
        'updated_at',
      ],
      description: 'Team member records with org scoping',
    },
    locations: {
      columns: [
        'id',
        'organization_id',
        'name',
        'normalized_name',
        'kind',
        'line1',
        'city',
        'state',
        'postal_code',
        'latitude',
        'longitude',
        'is_active',
        'created_at',
        'updated_at',
      ],
      description: 'Location records with normalization',
    },
    outreach_logs: {
      columns: [
        'id',
        'organization_id',
        'user_id',
        'occurred_at',
        'zip_code',
        'location_id',
        'legacy_location',
        'legacy_team_members',
        'kit_types',
        'num_kits',
        'people_reached',
        'males_reached',
        'females_reached',
        'trip_count',
        'team_organization',
        'notes',
      ],
      description: 'Enhanced outreach logs with location and team member links',
    },
    outreach_team_members: {
      columns: ['outreach_log_id', 'team_member_id'],
      description: 'Junction table for outreach-team member relationships',
    },
  };

  const expectedViews = {
    team_member_stats_v1: 'Team member activity statistics',
    location_analytics_v1: 'Location-based analytics',
    activity_timeline_v1: 'Activity timeline with team and location data',
  };

  // Test each expected table
  console.log('📋 TABLE ANALYSIS');
  console.log('==================');

  for (const [tableName, tableInfo] of Object.entries(expectedTables)) {
    console.log(`\n🔍 Checking table: ${tableName}`);
    console.log(`   Purpose: ${tableInfo.description}`);

    try {
      // Try to get table structure by selecting with limit 0
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        analysis.tables[tableName] = {
          exists: false,
          error: error.message,
          status: '❌ MISSING',
        };
        analysis.missing.push(`Table ${tableName}: ${error.message}`);
        console.log(`   ❌ MISSING: ${error.message}`);
      } else {
        analysis.tables[tableName] = {
          exists: true,
          status: '✅ EXISTS',
        };
        console.log(`   ✅ EXISTS`);

        // Try to detect columns by attempting to select specific ones
        const columnTests = {};
        for (const column of tableInfo.columns) {
          try {
            const { error: colError } = await supabase
              .from(tableName)
              .select(column)
              .limit(1);

            if (colError) {
              columnTests[column] = { exists: false, error: colError.message };
              console.log(`      ❌ Column '${column}': ${colError.message}`);
            } else {
              columnTests[column] = { exists: true };
              console.log(`      ✅ Column '${column}': OK`);
            }
          } catch (err) {
            columnTests[column] = { exists: false, error: err.message };
            console.log(`      ❌ Column '${column}': ${err.message}`);
          }
        }

        analysis.tables[tableName].columns = columnTests;

        // Check if any columns are missing
        const missingColumns = Object.entries(columnTests)
          .filter(([_, info]) => !info.exists)
          .map(([col, _]) => col);

        if (missingColumns.length > 0) {
          analysis.missing.push(
            `Table ${tableName} missing columns: ${missingColumns.join(', ')}`,
          );
        }
      }
    } catch (err) {
      analysis.tables[tableName] = {
        exists: false,
        error: err.message,
        status: '❌ ERROR',
      };
      console.log(`   ❌ ERROR: ${err.message}`);
    }
  }

  // Test each expected view
  console.log('\n\n📊 VIEW ANALYSIS');
  console.log('=================');

  for (const [viewName, description] of Object.entries(expectedViews)) {
    console.log(`\n🔍 Checking view: ${viewName}`);
    console.log(`   Purpose: ${description}`);

    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);

      if (error) {
        analysis.views[viewName] = {
          exists: false,
          error: error.message,
          status: '❌ MISSING',
        };
        analysis.missing.push(`View ${viewName}: ${error.message}`);
        console.log(`   ❌ MISSING: ${error.message}`);
      } else {
        analysis.views[viewName] = {
          exists: true,
          status: '✅ EXISTS',
          hasData: data && data.length > 0,
        };
        console.log(
          `   ✅ EXISTS${data && data.length > 0 ? ' (has data)' : ' (empty)'}`,
        );
      }
    } catch (err) {
      analysis.views[viewName] = {
        exists: false,
        error: err.message,
        status: '❌ ERROR',
      };
      console.log(`   ❌ ERROR: ${err.message}`);
    }
  }

  // Generate recommendations
  console.log('\n\n🔧 RECOMMENDATIONS');
  console.log('===================');

  if (analysis.missing.length === 0) {
    console.log('🎉 All schema components are present and working!');
    analysis.recommendations.push(
      'Schema is complete - ready for production use',
    );
  } else {
    console.log('⚠️ Found issues that need to be addressed:\n');

    analysis.missing.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });

    // Generate specific SQL recommendations
    console.log('\n📝 REQUIRED SQL UPDATES:');
    console.log('========================');

    // Check for missing outreach_logs columns
    const outreachTable = analysis.tables['outreach_logs'];
    if (outreachTable && outreachTable.exists && outreachTable.columns) {
      const missingOutreachCols = [];
      if (!outreachTable.columns['location_id']?.exists)
        missingOutreachCols.push(
          'location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL',
        );
      if (!outreachTable.columns['legacy_location']?.exists)
        missingOutreachCols.push('legacy_location text');
      if (!outreachTable.columns['legacy_team_members']?.exists)
        missingOutreachCols.push('legacy_team_members text[]');

      if (missingOutreachCols.length > 0) {
        console.log('\n-- Add missing columns to outreach_logs:');
        console.log('ALTER TABLE public.outreach_logs');
        missingOutreachCols.forEach((col, index) => {
          console.log(
            `ADD COLUMN IF NOT EXISTS ${col}${index < missingOutreachCols.length - 1 ? ',' : ';'}`,
          );
        });
        console.log(
          '\nCREATE INDEX IF NOT EXISTS outreach_logs_location_idx ON public.outreach_logs (location_id);',
        );
      }
    }

    // Check for missing views
    const missingViews = Object.entries(analysis.views)
      .filter(([_, info]) => !info.exists)
      .map(([name, _]) => name);

    if (missingViews.length > 0) {
      console.log('\n-- Create missing analytics views:');
      console.log(
        '-- (See MIGRATION_INSTRUCTIONS.md for complete view definitions)',
      );
      missingViews.forEach((view) => {
        console.log(`-- CREATE OR REPLACE VIEW public.${view} AS ...`);
      });
    }
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('==========');

  const totalTables = Object.keys(expectedTables).length;
  const existingTables = Object.values(analysis.tables).filter(
    (t) => t.exists,
  ).length;
  const totalViews = Object.keys(expectedViews).length;
  const existingViews = Object.values(analysis.views).filter(
    (v) => v.exists,
  ).length;

  console.log(
    `Tables: ${existingTables}/${totalTables} (${Math.round((existingTables / totalTables) * 100)}%)`,
  );
  console.log(
    `Views: ${existingViews}/${totalViews} (${Math.round((existingViews / totalViews) * 100)}%)`,
  );
  console.log(`Issues: ${analysis.missing.length}`);

  const overallHealth =
    analysis.missing.length === 0
      ? 'HEALTHY'
      : analysis.missing.length <= 3
        ? 'NEEDS ATTENTION'
        : 'CRITICAL';

  console.log(`Overall Status: ${overallHealth}`);

  return analysis;
}

if (require.main === module) {
  analyzeSchema()
    .then((analysis) => {
      const isHealthy = analysis.missing.length === 0;
      process.exit(isHealthy ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Schema analysis error:', error);
      process.exit(1);
    });
}

module.exports = { analyzeSchema };
