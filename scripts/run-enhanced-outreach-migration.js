#!/usr/bin/env node

/**
 * Enhanced Outreach Analytics Migration Runner
 *
 * This script helps execute and monitor the enhanced outreach analytics migration.
 * It provides a safe way to run the migration with proper validation and rollback capabilities.
 *
 * Usage:
 *   node scripts/run-enhanced-outreach-migration.js [command]
 *
 * Commands:
 *   validate    - Run pre-migration validation only
 *   migrate     - Execute the full migration
 *   status      - Check migration status
 *   rollback    - Rollback the migration (emergency use)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);

class MigrationRunner {
  constructor() {
    this.migrationName = 'enhanced_outreach_analytics';
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      throw new Error(
        'EXPO_PUBLIC_SUPABASE_URL environment variable is required',
      );
    }

    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required',
      );
    }

    // Test database connection
    const { data, error } = await supabase
      .from('outreach_logs')
      .select('count', { count: 'exact', head: true });
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('✅ Environment validation passed');
    return true;
  }

  async getPreMigrationStats() {
    console.log('📊 Collecting pre-migration statistics...');

    const { data, error } = await supabase.rpc('get_pre_migration_stats');
    if (error) {
      // Fallback to manual queries if function doesn't exist
      const queries = [
        {
          name: 'total_outreach_logs',
          query: 'SELECT COUNT(*) as count FROM outreach_logs',
        },
        {
          name: 'logs_with_location',
          query:
            "SELECT COUNT(*) as count FROM outreach_logs WHERE location IS NOT NULL AND trim(location) != ''",
        },
        {
          name: 'logs_with_team_members',
          query:
            "SELECT COUNT(*) as count FROM outreach_logs WHERE team_members IS NOT NULL AND trim(team_members) != ''",
        },
        {
          name: 'existing_locations',
          query:
            'SELECT COUNT(*) as count FROM locations WHERE is_active = true',
        },
        {
          name: 'existing_team_members',
          query:
            'SELECT COUNT(*) as count FROM team_members WHERE is_active = true',
        },
      ];

      const stats = {};
      for (const query of queries) {
        try {
          const { data: result, error: queryError } = await supabase.rpc(
            'exec_sql',
            { sql: query.query },
          );
          if (!queryError && result && result.length > 0) {
            stats[query.name] = result[0].count;
          } else {
            stats[query.name] = 0;
          }
        } catch (err) {
          console.warn(`⚠️  Could not get ${query.name}: ${err.message}`);
          stats[query.name] = 0;
        }
      }

      console.log('📈 Pre-migration statistics:', stats);
      return stats;
    }

    console.log('📈 Pre-migration statistics:', data);
    return data;
  }

  async checkMigrationStatus() {
    console.log('🔍 Checking migration status...');

    try {
      const { data, error } = await supabase
        .from('migration_log')
        .select('*')
        .eq('migration_name', this.migrationName)
        .order('start_time', { ascending: false });

      if (error) {
        console.log(
          'ℹ️  Migration log table not found - migration not started',
        );
        return { status: 'not_started', logs: [] };
      }

      if (!data || data.length === 0) {
        console.log('ℹ️  No migration logs found - migration not started');
        return { status: 'not_started', logs: [] };
      }

      const latestLog = data[0];
      console.log('📋 Latest migration status:', latestLog.status);
      console.log('📋 Migration logs:');
      data.forEach((log) => {
        console.log(`  ${log.step_name}: ${log.status} (${log.start_time})`);
      });

      return { status: latestLog.status, logs: data };
    } catch (err) {
      console.log('ℹ️  Could not check migration status:', err.message);
      return { status: 'unknown', logs: [] };
    }
  }

  async executeMigrationFile(filePath) {
    console.log(`📄 Executing migration file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.error(`❌ Error executing statement: ${error.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
          executedCount++;
        } catch (err) {
          console.error(`❌ Failed to execute statement: ${err.message}`);
          throw err;
        }
      }
    }

    console.log(
      `✅ Executed ${executedCount} statements from ${path.basename(filePath)}`,
    );
  }

  async runMigration() {
    console.log('🚀 Starting enhanced outreach analytics migration...');

    try {
      // Validate environment
      await this.validateEnvironment();

      // Get pre-migration stats
      const preStats = await this.getPreMigrationStats();

      // Check if migration already completed
      const status = await this.checkMigrationStatus();
      if (status.status === 'completed') {
        console.log('✅ Migration already completed');
        return;
      }

      // Execute migration files in order
      const migrationFiles = [
        'supabase/migrations/20251101_create_enhanced_outreach_analytics.sql',
        'supabase/migrations/20251101_migrate_location_data.sql',
        'supabase/migrations/20251101_migrate_team_member_data.sql',
        'supabase/migrations/20251101_complete_data_migration.sql',
      ];

      for (const file of migrationFiles) {
        if (fs.existsSync(file)) {
          await this.executeMigrationFile(file);
        } else {
          console.warn(`⚠️  Migration file not found: ${file}`);
        }
      }

      console.log('✅ Migration completed successfully!');

      // Show final status
      await this.checkMigrationStatus();
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('💡 You can check the migration_log table for details');
      console.error(
        '💡 Use the rollback command if needed: node scripts/run-enhanced-outreach-migration.js rollback',
      );
      process.exit(1);
    }
  }

  async rollbackMigration() {
    console.log('⚠️  Starting migration rollback...');
    console.log(
      '⚠️  This will remove all migrated data and restore the original state',
    );

    // In a real implementation, you might want to add a confirmation prompt
    console.log('🔄 Executing rollback...');

    try {
      const { error } = await supabase.rpc(
        'rollback_enhanced_outreach_migration',
      );
      if (error) {
        throw error;
      }

      console.log('✅ Rollback completed successfully');
      await this.checkMigrationStatus();
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'migrate';
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'validate':
        await runner.validateEnvironment();
        await runner.getPreMigrationStats();
        break;

      case 'migrate':
        await runner.runMigration();
        break;

      case 'status':
        await runner.checkMigrationStatus();
        break;

      case 'rollback':
        await runner.rollbackMigration();
        break;

      default:
        console.log(
          'Usage: node scripts/run-enhanced-outreach-migration.js [validate|migrate|status|rollback]',
        );
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };
