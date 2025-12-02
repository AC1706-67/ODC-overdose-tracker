#!/usr/bin/env node

/**
 * Performance Tests for Analytics Queries
 *
 * This test suite validates that analytics queries perform within acceptable limits
 * and can handle expected data volumes efficiently.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://vitwypicporqpeefwsjs.supabase.co',
  supabaseKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpdHd5cGljcG9ycXBlZWZ3c2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc0NTUsImV4cCI6MjA3NDE2MzQ1NX0.LZvBs3c5XIQPTdEDwkEEqZO0irjmR7WZnsSsyuZ7wcI',
  performanceThresholds: {
    fast: 500, // < 500ms
    acceptable: 2000, // < 2s
    slow: 5000, // < 5s
  },
};

class AnalyticsPerformanceTests {
  constructor() {
    this.supabase = createClient(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseKey,
    );
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      performanceMetrics: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: '📋',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        test: '🧪',
        perf: '⚡',
      }[type] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running: ${testName}`, 'test');
      await testFunction();
      this.testResults.passed++;
      this.log(`PASSED: ${testName}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
      this.log(`FAILED: ${testName} - ${error.message}`, 'error');
    }
  }

  async measureQueryPerformance(
    queryName,
    queryFunction,
    expectedThreshold = 'acceptable',
  ) {
    const startTime = Date.now();
    let result;
    let error;

    try {
      result = await queryFunction();
    } catch (err) {
      error = err;
    }

    const executionTime = Date.now() - startTime;
    const threshold = TEST_CONFIG.performanceThresholds[expectedThreshold];

    const metric = {
      query: queryName,
      executionTime,
      threshold,
      expectedThreshold,
      passed: !error && executionTime <= threshold,
      error: error?.message,
      recordCount: result?.data?.length || 0,
    };

    this.testResults.performanceMetrics.push(metric);

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    if (executionTime > threshold) {
      throw new Error(
        `Query too slow: ${executionTime}ms (max: ${threshold}ms)`,
      );
    }

    this.log(
      `Query completed in ${executionTime}ms (${metric.recordCount} records)`,
      'perf',
    );
    return result;
  }

  // Test 1: Basic Table Query Performance
  async testBasicTablePerformance() {
    await this.measureQueryPerformance(
      'outreach_logs_basic_query',
      () => this.supabase.from('outreach_logs').select('*').limit(100),
      'fast',
    );

    await this.measureQueryPerformance(
      'outreach_logs_large_query',
      () => this.supabase.from('outreach_logs').select('*').limit(1000),
      'acceptable',
    );

    await this.measureQueryPerformance(
      'outreach_logs_filtered_query',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('*')
          .gte('outreach_date', '2024-01-01')
          .limit(500),
      'acceptable',
    );
  }

  // Test 2: Enhanced Analytics Views Performance
  async testAnalyticsViewsPerformance() {
    const views = [
      { name: 'team_member_stats_v1', threshold: 'acceptable' },
      { name: 'location_analytics_v1', threshold: 'acceptable' },
      { name: 'activity_timeline_v1', threshold: 'slow' },
    ];

    for (const view of views) {
      try {
        await this.measureQueryPerformance(
          `${view.name}_query`,
          () => this.supabase.from(view.name).select('*').limit(100),
          view.threshold,
        );
      } catch (error) {
        if (error.message.includes('does not exist')) {
          this.log(
            `View ${view.name} not yet created - skipping performance test`,
            'warning',
          );
        } else {
          throw error;
        }
      }
    }
  }

  // Test 3: Aggregation Query Performance
  async testAggregationPerformance() {
    await this.measureQueryPerformance(
      'outreach_aggregation_by_zip',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('zip_code, people_reached.sum(), num_kits.sum()')
          .limit(50),
      'acceptable',
    );

    await this.measureQueryPerformance(
      'outreach_monthly_aggregation',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('outreach_date, people_reached.sum(), num_kits.sum()')
          .gte('outreach_date', '2024-01-01')
          .limit(100),
      'acceptable',
    );
  }

  // Test 4: Join Query Performance (if enhanced tables exist)
  async testJoinQueryPerformance() {
    // Test team_members join (if table exists)
    try {
      await this.measureQueryPerformance(
        'team_members_with_outreach',
        () =>
          this.supabase
            .from('team_members')
            .select(
              `
            *,
            outreach_team_members(
              outreach_log_id,
              outreach_logs(outreach_date, people_reached)
            )
          `,
            )
            .limit(50),
        'slow',
      );
    } catch (error) {
      if (error.message.includes('does not exist')) {
        this.log(
          'Enhanced tables not yet created - skipping join performance tests',
          'warning',
        );
      } else {
        throw error;
      }
    }

    // Test locations join (if table exists)
    try {
      await this.measureQueryPerformance(
        'locations_with_outreach',
        () =>
          this.supabase
            .from('locations')
            .select(
              `
            *,
            outreach_logs(outreach_date, people_reached, num_kits)
          `,
            )
            .limit(50),
        'slow',
      );
    } catch (error) {
      if (error.message.includes('does not exist')) {
        this.log(
          'Enhanced tables not yet created - skipping location join tests',
          'warning',
        );
      } else {
        throw error;
      }
    }
  }

  // Test 5: Dashboard Query Performance
  async testDashboardQueryPerformance() {
    // Test typical dashboard queries
    await this.measureQueryPerformance(
      'dashboard_recent_outreach',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('*')
          .order('outreach_date', { ascending: false })
          .limit(20),
      'fast',
    );

    await this.measureQueryPerformance(
      'dashboard_monthly_stats',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('outreach_date, people_reached, num_kits')
          .gte(
            'outreach_date',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          )
          .limit(500),
      'acceptable',
    );

    await this.measureQueryPerformance(
      'dashboard_zip_code_stats',
      () =>
        this.supabase
          .from('outreach_logs')
          .select('zip_code, people_reached, num_kits')
          .not('zip_code', 'is', null)
          .limit(200),
      'acceptable',
    );
  }

  // Test 6: Concurrent Query Performance
  async testConcurrentQueryPerformance() {
    const concurrentQueries = [
      () => this.supabase.from('outreach_logs').select('*').limit(50),
      () =>
        this.supabase
          .from('outreach_logs')
          .select('zip_code, people_reached')
          .limit(100),
      () =>
        this.supabase
          .from('outreach_logs')
          .select('outreach_date, num_kits')
          .limit(75),
    ];

    const startTime = Date.now();

    try {
      const results = await Promise.all(
        concurrentQueries.map((query) => query()),
      );
      const totalTime = Date.now() - startTime;

      if (totalTime > TEST_CONFIG.performanceThresholds.slow) {
        throw new Error(`Concurrent queries too slow: ${totalTime}ms`);
      }

      this.log(`Concurrent queries completed in ${totalTime}ms`, 'perf');
    } catch (error) {
      throw new Error(`Concurrent query test failed: ${error.message}`);
    }
  }

  // Test 7: Memory Usage Validation
  async testMemoryUsage() {
    const initialMemory = process.memoryUsage();

    // Run a series of queries to test memory usage
    for (let i = 0; i < 5; i++) {
      await this.supabase.from('outreach_logs').select('*').limit(200);
    }

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 50MB for test queries)
    const maxMemoryIncrease = 50 * 1024 * 1024; // 50MB

    if (memoryIncrease > maxMemoryIncrease) {
      throw new Error(
        `Excessive memory usage: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`,
      );
    }

    this.log(
      `Memory usage increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`,
      'perf',
    );
  }

  // Generate performance report
  generatePerformanceReport() {
    this.log('='.repeat(60), 'info');
    this.log('PERFORMANCE METRICS REPORT', 'info');
    this.log('='.repeat(60), 'info');

    const metrics = this.testResults.performanceMetrics;

    if (metrics.length === 0) {
      this.log('No performance metrics collected', 'warning');
      return;
    }

    // Group by performance category
    const fast = metrics.filter(
      (m) => m.executionTime <= TEST_CONFIG.performanceThresholds.fast,
    );
    const acceptable = metrics.filter(
      (m) =>
        m.executionTime > TEST_CONFIG.performanceThresholds.fast &&
        m.executionTime <= TEST_CONFIG.performanceThresholds.acceptable,
    );
    const slow = metrics.filter(
      (m) =>
        m.executionTime > TEST_CONFIG.performanceThresholds.acceptable &&
        m.executionTime <= TEST_CONFIG.performanceThresholds.slow,
    );
    const tooSlow = metrics.filter(
      (m) => m.executionTime > TEST_CONFIG.performanceThresholds.slow,
    );

    this.log(
      `Fast queries (< ${TEST_CONFIG.performanceThresholds.fast}ms): ${fast.length}`,
      'success',
    );
    this.log(
      `Acceptable queries (< ${TEST_CONFIG.performanceThresholds.acceptable}ms): ${acceptable.length}`,
      'success',
    );
    this.log(
      `Slow queries (< ${TEST_CONFIG.performanceThresholds.slow}ms): ${slow.length}`,
      'warning',
    );
    this.log(
      `Too slow queries (> ${TEST_CONFIG.performanceThresholds.slow}ms): ${tooSlow.length}`,
      'error',
    );

    // Show slowest queries
    const slowest = metrics
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 5);

    this.log('\nSlowest Queries:', 'info');
    slowest.forEach((metric) => {
      const status = metric.passed ? '✅' : '❌';
      this.log(
        `  ${status} ${metric.query}: ${metric.executionTime}ms (${metric.recordCount} records)`,
        'info',
      );
    });

    // Calculate average performance
    const avgTime =
      metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
    this.log(`\nAverage query time: ${Math.round(avgTime)}ms`, 'info');

    // Performance score
    const passedQueries = metrics.filter((m) => m.passed).length;
    const performanceScore = (passedQueries / metrics.length) * 100;
    this.log(
      `Performance score: ${performanceScore.toFixed(1)}%`,
      performanceScore >= 80 ? 'success' : 'warning',
    );
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting Analytics Performance Test Suite', 'info');
    this.log('='.repeat(60), 'info');

    const tests = [
      {
        name: 'Basic Table Query Performance',
        fn: () => this.testBasicTablePerformance(),
      },
      {
        name: 'Analytics Views Performance',
        fn: () => this.testAnalyticsViewsPerformance(),
      },
      {
        name: 'Aggregation Query Performance',
        fn: () => this.testAggregationPerformance(),
      },
      {
        name: 'Join Query Performance',
        fn: () => this.testJoinQueryPerformance(),
      },
      {
        name: 'Dashboard Query Performance',
        fn: () => this.testDashboardQueryPerformance(),
      },
      {
        name: 'Concurrent Query Performance',
        fn: () => this.testConcurrentQueryPerformance(),
      },
      { name: 'Memory Usage Validation', fn: () => this.testMemoryUsage() },
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    // Generate performance report
    this.generatePerformanceReport();

    // Print summary
    this.log('='.repeat(60), 'info');
    this.log('PERFORMANCE TEST SUMMARY', 'info');
    this.log(
      `Total Tests: ${this.testResults.passed + this.testResults.failed}`,
      'info',
    );
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(
      `Failed: ${this.testResults.failed}`,
      this.testResults.failed > 0 ? 'error' : 'success',
    );

    if (this.testResults.errors.length > 0) {
      this.log('FAILED TESTS:', 'error');
      this.testResults.errors.forEach(({ test, error }) => {
        this.log(`  - ${test}: ${error}`, 'error');
      });
    }

    const successRate =
      (this.testResults.passed /
        (this.testResults.passed + this.testResults.failed)) *
      100;
    this.log(
      `Success Rate: ${successRate.toFixed(1)}%`,
      successRate >= 80 ? 'success' : 'warning',
    );

    if (this.testResults.failed === 0) {
      this.log('🎉 ALL PERFORMANCE TESTS PASSED!', 'success');
    } else if (successRate >= 80) {
      this.log(
        '✅ Most performance tests passed. Review slow queries.',
        'warning',
      );
    } else {
      this.log(
        '❌ Multiple performance test failures. Optimize queries before deployment.',
        'error',
      );
    }

    return this.testResults.failed === 0;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new AnalyticsPerformanceTests();
  tester
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Performance test runner error:', error);
      process.exit(1);
    });
}

module.exports = { AnalyticsPerformanceTests };
