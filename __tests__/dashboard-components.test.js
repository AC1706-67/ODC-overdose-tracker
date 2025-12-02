#!/usr/bin/env node

/**
 * Integration Tests for Enhanced Dashboard Components
 *
 * This test suite validates the dashboard components work correctly
 * with the enhanced outreach analytics data structure.
 */

const fs = require('fs');
const path = require('path');

class DashboardComponentTests {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
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

  // Test 1: Component File Structure
  async testComponentFileStructure() {
    const requiredComponents = [
      'components/TeamMemberAnalytics.tsx',
      'components/TeamMemberPerformanceCard.tsx',
      'components/TeamMemberActivityTimeline.tsx',
      'components/TeamMemberComparisonChart.tsx',
      'components/LocationAnalytics.tsx',
      'components/LocationCoverageMap.tsx',
      'components/LocationActivityChart.tsx',
      'components/LocationEffectivenessMetrics.tsx',
      'components/TeamMemberPicker.tsx',
      'components/LocationPicker.tsx',
    ];

    for (const component of requiredComponents) {
      if (!fs.existsSync(component)) {
        throw new Error(`Required component not found: ${component}`);
      }

      const content = fs.readFileSync(component, 'utf8');

      // Basic React component validation
      if (!content.includes('export') || !content.includes('React')) {
        throw new Error(
          `Component ${component} doesn't appear to be a valid React component`,
        );
      }

      // Check for TypeScript
      if (!content.includes('interface') && !content.includes('type ')) {
        this.log(
          `Warning: ${component} may be missing TypeScript types`,
          'warning',
        );
      }
    }

    this.log(
      `Validated ${requiredComponents.length} component files`,
      'success',
    );
  }

  // Test 2: Component Props Validation
  async testComponentProps() {
    const componentTests = [
      {
        file: 'components/TeamMemberAnalytics.tsx',
        expectedProps: ['organizationId', 'teamMembers', 'onTeamMemberSelect'],
      },
      {
        file: 'components/LocationAnalytics.tsx',
        expectedProps: ['organizationId', 'locations', 'onLocationSelect'],
      },
      {
        file: 'components/TeamMemberPicker.tsx',
        expectedProps: [
          'organizationId',
          'selectedMembers',
          'onSelectionChange',
        ],
      },
      {
        file: 'components/LocationPicker.tsx',
        expectedProps: [
          'organizationId',
          'selectedLocation',
          'onLocationChange',
        ],
      },
    ];

    for (const test of componentTests) {
      if (!fs.existsSync(test.file)) {
        continue; // Skip if file doesn't exist (already tested above)
      }

      const content = fs.readFileSync(test.file, 'utf8');

      // Check for interface or type definitions
      const hasInterface =
        content.includes('interface') || content.includes('type ');
      if (!hasInterface) {
        this.log(
          `Warning: ${test.file} missing TypeScript interface`,
          'warning',
        );
        continue;
      }

      // Check for expected props (basic string matching)
      for (const prop of test.expectedProps) {
        if (!content.includes(prop)) {
          this.log(
            `Warning: ${test.file} may be missing prop: ${prop}`,
            'warning',
          );
        }
      }
    }

    this.log('Component props validation completed', 'success');
  }

  // Test 3: API Integration Validation
  async testApiIntegration() {
    const apiFile = 'src/api/enhancedOutreach.ts';

    if (!fs.existsSync(apiFile)) {
      throw new Error(`API file not found: ${apiFile}`);
    }

    const content = fs.readFileSync(apiFile, 'utf8');

    // Check for required API functions
    const requiredFunctions = [
      'getTeamMembers',
      'getLocations',
      'getTeamMemberStats',
      'getLocationAnalytics',
      'getActivityTimeline',
    ];

    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`Required API function not found: ${func}`);
      }
    }

    // Check for proper error handling
    if (!content.includes('try') || !content.includes('catch')) {
      this.log('Warning: API file may be missing error handling', 'warning');
    }

    // Check for TypeScript types
    if (!content.includes('interface') && !content.includes('type ')) {
      this.log('Warning: API file may be missing TypeScript types', 'warning');
    }

    this.log('API integration validation completed', 'success');
  }

  // Test 4: Hook Integration Validation
  async testHookIntegration() {
    const hookFiles = ['hooks/useOrgDashboard.ts', 'hooks/useDashboardData.ts'];

    for (const hookFile of hookFiles) {
      if (!fs.existsSync(hookFile)) {
        this.log(`Warning: Hook file not found: ${hookFile}`, 'warning');
        continue;
      }

      const content = fs.readFileSync(hookFile, 'utf8');

      // Check for React hook patterns
      if (!content.includes('useState') && !content.includes('useEffect')) {
        this.log(
          `Warning: ${hookFile} may not be using React hooks properly`,
          'warning',
        );
      }

      // Check for enhanced outreach integration
      if (content.includes('outreach') && !content.includes('enhanced')) {
        this.log(
          `Info: ${hookFile} may need updates for enhanced analytics`,
          'warning',
        );
      }
    }

    this.log('Hook integration validation completed', 'success');
  }

  // Test 5: Dashboard Screen Integration
  async testDashboardScreenIntegration() {
    const dashboardFile = 'screens/dashboard/OutreachDashboardScreen.tsx';

    if (!fs.existsSync(dashboardFile)) {
      throw new Error(`Dashboard screen not found: ${dashboardFile}`);
    }

    const content = fs.readFileSync(dashboardFile, 'utf8');

    // Check for enhanced analytics components
    const enhancedComponents = [
      'TeamMemberAnalytics',
      'LocationAnalytics',
      'TeamMemberPicker',
      'LocationPicker',
    ];

    let foundComponents = 0;
    for (const component of enhancedComponents) {
      if (content.includes(component)) {
        foundComponents++;
      }
    }

    if (foundComponents === 0) {
      this.log(
        'Warning: Dashboard may not be using enhanced analytics components',
        'warning',
      );
    } else {
      this.log(
        `Dashboard integrates ${foundComponents}/${enhancedComponents.length} enhanced components`,
        'success',
      );
    }

    // Check for proper state management
    if (!content.includes('useState') && !content.includes('useEffect')) {
      this.log('Warning: Dashboard may be missing state management', 'warning');
    }

    this.log('Dashboard screen integration validation completed', 'success');
  }

  // Test 6: Type Definitions Validation
  async testTypeDefinitions() {
    const typeFile = 'types/enhanced-outreach.ts';

    if (!fs.existsSync(typeFile)) {
      throw new Error(`Type definitions file not found: ${typeFile}`);
    }

    const content = fs.readFileSync(typeFile, 'utf8');

    // Check for required type definitions
    const requiredTypes = [
      'TeamMember',
      'Location',
      'OutreachTeamMember',
      'EnhancedOutreachLog',
    ];

    for (const type of requiredTypes) {
      if (!content.includes(type)) {
        throw new Error(`Required type definition not found: ${type}`);
      }
    }

    // Check for proper interface structure
    if (!content.includes('interface') && !content.includes('type ')) {
      throw new Error('Type definitions file appears to be empty or invalid');
    }

    this.log('Type definitions validation completed', 'success');
  }

  // Test 7: Component Rendering Logic
  async testComponentRenderingLogic() {
    const criticalComponents = [
      'components/TeamMemberAnalytics.tsx',
      'components/LocationAnalytics.tsx',
    ];

    for (const component of criticalComponents) {
      if (!fs.existsSync(component)) {
        continue;
      }

      const content = fs.readFileSync(component, 'utf8');

      // Check for proper JSX structure
      if (!content.includes('return') || !content.includes('<')) {
        throw new Error(
          `Component ${component} appears to be missing JSX return statement`,
        );
      }

      // Check for loading states
      if (!content.includes('loading') && !content.includes('Loading')) {
        this.log(
          `Warning: ${component} may be missing loading state`,
          'warning',
        );
      }

      // Check for error handling in render
      if (!content.includes('error') && !content.includes('Error')) {
        this.log(
          `Warning: ${component} may be missing error handling`,
          'warning',
        );
      }

      // Check for data validation
      if (!content.includes('length') && !content.includes('map')) {
        this.log(
          `Warning: ${component} may not be handling array data properly`,
          'warning',
        );
      }
    }

    this.log('Component rendering logic validation completed', 'success');
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting Dashboard Components Integration Test Suite', 'info');
    this.log('='.repeat(60), 'info');

    const tests = [
      {
        name: 'Component File Structure',
        fn: () => this.testComponentFileStructure(),
      },
      {
        name: 'Component Props Validation',
        fn: () => this.testComponentProps(),
      },
      {
        name: 'API Integration Validation',
        fn: () => this.testApiIntegration(),
      },
      {
        name: 'Hook Integration Validation',
        fn: () => this.testHookIntegration(),
      },
      {
        name: 'Dashboard Screen Integration',
        fn: () => this.testDashboardScreenIntegration(),
      },
      {
        name: 'Type Definitions Validation',
        fn: () => this.testTypeDefinitions(),
      },
      {
        name: 'Component Rendering Logic',
        fn: () => this.testComponentRenderingLogic(),
      },
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    // Print summary
    this.log('='.repeat(60), 'info');
    this.log('DASHBOARD COMPONENTS TEST SUMMARY', 'info');
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
      this.log('🎉 ALL DASHBOARD COMPONENT TESTS PASSED!', 'success');
    } else if (successRate >= 80) {
      this.log(
        '✅ Most dashboard component tests passed. Review warnings.',
        'warning',
      );
    } else {
      this.log(
        '❌ Multiple dashboard component test failures. Review implementation.',
        'error',
      );
    }

    return this.testResults.failed === 0;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new DashboardComponentTests();
  tester
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Dashboard component test runner error:', error);
      process.exit(1);
    });
}

module.exports = { DashboardComponentTests };
