import { defaultReporter } from '@web/test-runner';
import { puppeteerLauncher } from '@web/test-runner-puppeteer';
import snowpackWebTestRunner from '@snowpack/web-test-runner-plugin';

// Set NODE_ENV to test to ensure snowpack builds in test mode.
process.env.NODE_ENV = 'test';

/**
 * Test result reporter which supports detailed output of chai/jasmine/etc test
 * results. Inspired by code here:
 * https://github.com/modernweb-dev/web/issues/229#issuecomment-732005741
 */
class SpecReporter {
  constructor() {
    // TODO(https://github.com/eslint/eslint/issues/14343): Change to class field when eslint supports it.
    this.color = {
      reset: '\u001B[0m',
      cyan: '\u001B[36m',
      red: '\u001B[31m',
      green: '\u001B[32m',
      dim: '\u001B[2m',
      yellow: '\u001B[33m',
    };
  }

  /**
   * @param {import('@web/test-runner').TestSuiteResult} suite
   * @param indent
   * @returns
   */
  outputSuite(suite, indent = '') {
    if (suite === undefined) {
      return 'Suite is undefined; top level error';
    }

    let results = `${indent}${suite.name}\n`;
    results +=
      suite.tests
        .map((test) => {
          let result = indent;
          if (test.skipped) {
            result += `${this.color.cyan} - ${test.name}`;
          } else if (test.passed) {
            result += `${this.color.green} ✓ ${this.color.reset}${this.color.dim}${test.name}`;
          } else {
            if (test.error === undefined) {
              test.error = {};
              test.error.message = 'Test failed with no error message';
              test.error.stack = '<no stack trace>';
            }

            result += `${this.color.red} ${test.name}\n\n${test.error.message}\n${test.error.stack}`;
          }

          result +=
            test.duration > 100
              ? ` ${this.color.reset}${this.color.red}(${test.duration}ms)`
              : test.duration > 50
              ? ` ${this.color.reset}${this.color.yellow}(${test.duration}ms)`
              : '';
          result += `${this.color.reset}`;

          return result;
        })
        .join('\n') + '\n';
    if (suite.suites) {
      results += suite.suites
        .map((suite) => this.outputSuite(suite, indent + '  '))
        .join('\n');
    }

    return results;
  }

  /**
   * @param testFile
   * @param {import('@web/test-runner').TestSession[]} sessionsForTestFile
   * @returns
   */
  async generateTestReport(testFile, sessionsForTestFile) {
    let results = '';
    for (const session of sessionsForTestFile) {
      if (session.testResults === undefined) {
        session.status + '\n\n';
        continue;
      }

      results += session.testResults.suites
        .map((suite) => this.outputSuite(suite, ''))
        .join('\n\n');
    }

    return results;
  }

  specReporter({ reportResults = true } = {}) {
    return {
      onTestRunFinished: () => {},
      reportTestFileResults: async ({
        logger,
        sessionsForTestFile,
        testFile,
      }) => {
        if (!reportResults) {
          return;
        }

        const testReport = await this.generateTestReport(
          testFile,
          sessionsForTestFile
        );
        logger.group();
        console.log(testReport);
        logger.groupEnd();
      },
    };
  }
}

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  coverageConfig: {
    exclude: ['**/snowpack/**/*', '**/*.test.ts*'],
  },
  browsers: [
    puppeteerLauncher({
      launchOptions: {
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        // Disable-gpu required for chrome to run for some reason.
        args: ['--disable-gpu', '--remote-debugging-port=9333'],
      },
    }),
  ],
  plugins: [snowpackWebTestRunner()],
  // Use custom runner HTML to add chrome stubs early since chrome APIs are used during
  // file initialization in rikaikun.
  testRunnerHtml: (testFramework) =>
    `<html>
      <body>
        <script type="module" src="test/chrome_stubs.js"></script>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,
  reporters: [
    // Gives overall test progress across all tests.
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    // Gives detailed description of chai test spec results.
    new SpecReporter().specReporter(),
  ],
};
