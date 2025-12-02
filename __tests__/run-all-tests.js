#!/usr/bin/env node

/**
 * Test Runner for Enhanced Outreach Analytics
 *
 * This script runs all test suites for the enhanced outreach analytics feature
 * and provides a comprehensive test report.
 */

const {
  EnhancedOutreachAnalyticsTests,
} = require('./enhanced-outreach-analytics.test.js');
const { DashboardComponentTests } = require('./dashboard-components.test.js');
const {
  AnalyticsPerformanceTests,
} = require('./analytics-performance.test.js');

class TestRunner {
  constructor() {
    this.overallResults = {
      suites: [],
      totalPassed: 0,
      totalFailed: 0,
      startTime: Date.now(),
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
        suite: '🧪',
        summary: '📊',
      }[type] || '📋';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTestSuite(suiteName, TestClass) {
    this.log(`Starting test suite: ${suiteName}`, 'suite');
    this.log('='.repeat(80), 'info');

    const startTime = Date.now();
    let success = false;
    let error = null;

    try {
      const tester = new TestClass();
      success = await tester.runAllTests();

      const suiteResult = {
        name: suiteName,
        success,
        duration: Date.now() - startTime,
        passed: tester.testResults.passed,
        failed: tester.testResults.failed,
        errors: tester.testResults.errors || [],
      };

      this.overallResults.suites.push(suiteResult);
      this.overallResults.totalPassed += suiteResult.passed;
      this.overallResults.totalFailed += suiteResult.failed;
    } catch (err) {
      error = err;
      const suiteResult = {
        name: suiteName,
        success: false,
        duration: Date.now() - startTime,
        passed: 0,
        failed: 1,
        errors: [{ test: 'Suite Execution', error: err.message }],
      };

      this.overallResults.suites.push(suiteResult);
      this.overallResults.totalFailed += 1;
    }

    const duration = Date.now() - startTime;
    if (success) {
      this.log(
        `✅ Test suite ${suiteName} completed successfully in ${duration}ms`,
        'success',
      );
    } else {
      this.log(`❌ Test suite ${suiteName} failed in ${duration}ms`, 'error');
      if (error) {
        this.log(`   Error: ${error.message}`, 'error');
      }
    }

    this.log('='.repeat(80), 'info');
    this.log('', 'info'); // Empty line for spacing

    return success;
  }

  generateOverallReport() {
    const totalDuration = Date.now() - this.overallResults.startTime;

    this.log('='.repeat(80), 'summary');
    this.log(
      'ENHANCED OUTREACH ANALYTICS - COMPREHENSIVE TEST REPORT',
      'summary',
    );
    this.log('='.repeat(80), 'summary');

    this.log(
      `Total execution time: ${Math.round(totalDuration / 1000)}s`,
      'info',
    );
    this.log(`Test suites run: ${this.overallResults.suites.length}`, 'info');
    this.log(
      `Total tests passed: ${this.overallResults.totalPassed}`,
      'success',
    );
    this.log(
      `Total tests failed: ${this.overallResults.totalFailed}`,
      this.overallResults.totalFailed > 0 ? 'error' : 'success',
    );

    this.log('', 'info');
    this.log('SUITE BREAKDOWN:', 'summary');

    this.overallResults.suites.forEach((suite) => {
      const status = suite.success ? '✅' : '❌';
      const duration = Math.round(suite.duration / 1000);
      this.log(
        `  ${status} ${suite.name}: ${suite.passed}/${suite.passed + suite.failed} tests passed (${duration}s)`,
        'info',
      );

      if (suite.errors.length > 0) {
        suite.errors.forEach((error) => {
          this.log(`    - ${error.test}: ${error.error}`, 'error');
        });
      }
    });

    // Calculate overall success rate
    const totalTests =
      this.overallResults.totalPassed + this.overallResults.totalFailed;
    const successRate =
      totalTests > 0 ? (this.overallResults.totalPassed / totalTests) * 100 : 0;

    this.log('', 'info');
    this.log(
      `OVERALL SUCCESS RATE: ${successRate.toFixed(1)}%`,
      successRate >= 80 ? 'success' : 'warning',
    );

    // Provide recommendations
    this.log('', 'info');
    this.log('RECOMMENDATIONS:', 'summary');

    if (successRate >= 95) {
      this.log(
        '🎉 Excellent! All systems are ready for deployment.',
        'success',
      );
    } else if (successRate >= 80) {
      this.log(
        '✅ Good! Review failed tests and warnings before deployment.',
        'warning',
      );
      this.log('   Most functionality should work correctly.', 'info');
    } else if (successRate >= 60) {
      this.log(
        '⚠️  Moderate issues detected. Address failed tests before deployment.',
        'warning',
      );
      this.log('   Core functionality may be impacted.', 'warning');
    } else {
      this.log(
        '❌ Significant issues detected. Do not deploy until tests pass.',
        'error',
      );
      this.log('   Major functionality is likely broken.', 'error');
    }

    // Specific recommendations based on suite results
    const failedSuites = this.overallResults.suites.filter((s) => !s.success);
    if (failedSuites.length > 0) {
      this.log('', 'info');
      this.log('FAILED SUITE ANALYSIS:', 'summary');

      failedSuites.forEach((suite) => {
        switch (suite.name) {
          case 'Enhanced Outreach Analytics Core':
            this.log(
              '  - Core analytics functionality has issues. Check database schema and migrations.',
              'error',
            );
            break;
          case 'Dashboard Components Integration':
            this.log(
              '  - Dashboard components have issues. Check component files and API integration.',
              'error',
            );
            break;
          case 'Analytics Performance':
            this.log(
              '  - Performance issues detected. Optimize queries and check database indexes.',
              'error',
            );
            break;
        }
      });
    }

    this.log('='.repeat(80), 'summary');

    return successRate >= 80;
  }

  async runAllTests() {
    this.log('🚀 Starting Enhanced Outreach Analytics Test Suite', 'info');
    this.log(`Test execution started at: ${new Date().toISOString()}`, 'info');
    this.log('', 'info');

    const testSuites = [
      {
        name: 'Enhanced Outreach Analytics Core',
        class: EnhancedOutreachAnalyticsTests,
      },
      {
        name: 'Dashboard Components Integration',
        class: DashboardComponentTests,
      },
      { name: 'Analytics Performance', class: AnalyticsPerformanceTests },
    ];

    let allPassed = true;

    for (const suite of testSuites) {
      const success = await this.runTestSuite(suite.name, suite.class);
      if (!success) {
        allPassed = false;
      }
    }

    // Generate comprehensive report
    const overallSuccess = this.generateOverallReport();

    return overallSuccess;
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();

  runner
    .runAllTests()
    .then((success) => {
      console.log('\n🏁 Test execution completed.');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test runner fatal error:', error);
      process.exit(1);
    });
}

module.exports = { TestRunner };
