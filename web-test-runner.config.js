import { browserstackLauncher } from '@web/test-runner-browserstack';
import { defaultReporter } from '@web/test-runner';
import { puppeteerLauncher } from '@web/test-runner-puppeteer';
import { visualRegressionPlugin } from '@web/test-runner-visual-regression/plugin';
import isDocker from 'is-docker';
//import snowpackWebTestRunner from '@snowpack/web-test-runner-plugin';
import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';

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
      reset: '\x1b[0m',
      cyan: '\x1b[36m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      dim: '\x1b[2m',
      yellow: '\x1b[33m',
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
    sessionsForTestFile.forEach((session) => {
      if (session.testResults === undefined) {
        return session.status + '\n\n';
      }
      results += session.testResults.suites
        .map((suite) => this.outputSuite(suite, ''))
        .join('\n\n');
    });
    return results;
  }

  specReporter({ reportResults = true } = {}) {
    return {
      onTestRunFinished: () => {
        // Do nothing
      },
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

// disable-gpu required if no X server is available.
// Leave it off by default, as it may add variance to visual tests.
const chromeArgs = ['--disable-gpu', '--remote-debugging-port=9333'];
if (isDocker) {
  // Inside of docker, Chrome's sandbox causes an error.
  chromeArgs.push('--no-sandbox');
}

/** @type {import('@web/test-runner').TestRunnerGroupConfig[]} */
const defaultConfig = {
  rootDir: 'extension',
  coverageConfig: {
    // Including this excludes tests and random node_module files from the report.
    // Excluding doesn't appear to do anything with vite.
    include: ['**/extension/*.ts'],
  },

  browsers: [
    puppeteerLauncher({
      launchOptions: {
        executablePath: process.env.RIKAIKUN_PUPPETEER_EXEC_PATH
          ? process.env.RIKAIKUN_PUPPETEER_EXEC_PATH
          : '/usr/bin/google-chrome',
        headless: true,
        args: chromeArgs,
      },
    }),
  ],
  plugins: [
    //    snowpackWebTestRunner(),
    vitePlugin(),
    visualRegressionPlugin({
      update: process.argv.includes('--update-visual-baseline'),
      // When not running in Github Actions, save to an unpushed local folder.
      baseDir: process.env.CI ? 'screenshots' : 'local-screenshots',
    }),
  ],
  // Use custom runner HTML to add chrome stubs early since chrome APIs are used during
  // file initialization in rikaikun.
  testRunnerHtml: (testFramework) =>
    `<html>
      <body>
        <!-- vite doesn't add global by default so add it here. -->
        <script>
          window.global ||= window;
        </script>
        <script type="module" src="test/chrome_stubs.ts"></script>
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

/** @type {import('@web/test-runner').TestRunnerGroupConfig[]} */
let config = defaultConfig;

if (process.argv.includes('--browserstack')) {
  config = {
    ...config,
    testFramework: {
      config: {
        ui: 'bdd',
        timeout: '40000',
      },
    },
    browserStartTimeout: 1000 * 60 * 1,
    testsStartTimeout: 1000 * 60 * 1,
    testsFinishTimeout: 1000 * 60 * 5,
    // how many browsers to run concurrently in browserstack. increasing this significantly
    // reduces testing time, but your subscription might limit concurrent connections
    concurrentBrowsers: 2,
    // Set concurrency to 1 so tests don't interfere during screenshots.
    concurrency: 1,
    browsers: [
      browserstackLauncher({
        capabilities: {
          browserName: 'Chrome',
          browserVersion: 'latest',
          os: 'windows',
          os_version: '10',
          // Used when creating the browser directory for screenshots
          platform: 'windows 10',
          // your username and key for browserstack, you can get this from your browserstack account
          // it's recommended to store these as environment variables
          'browserstack.user': process.env.BROWSER_STACK_USERNAME,
          'browserstack.key': process.env.BROWSER_STACK_ACCESS_KEY,

          project: 'rikaikun',
          name: 'CI Testing',
          // if you are running tests in a CI, the build id might be available as an
          // environment variable. this is useful for identifying test runs
          // this is for example the name for github actions
          build: `build ${process.env.GITHUB_RUN_NUMBER || 'local'}`,
          'browserstack.console': 'verbose',
        },
      }),
    ],
  };
}

export default config;
