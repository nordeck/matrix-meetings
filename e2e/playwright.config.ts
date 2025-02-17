/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './src',
  // Tests are really show on CI, increase the timeout
  timeout: 120_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['github'], ['html'], ['line']]
    : [['html'], ['line']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Collect video if required */
    video: process.env.CI ? 'on-first-retry' : 'off',

    /* Force a stable timezone and locale */
    timezoneId: 'Europe/Berlin',
    locale: 'en-US',

    baseURL: 'http://localhost:3000',
  },

  expect: {
    // Tests are really show on CI, increase the timeout
    timeout: 15_000,
  },

  webServer: {
    command: `docker run --rm -p 3000:8080 -e REACT_APP_API_BASE_URL=* ${
      process.env.IMAGE_ID ?? 'nordeck/matrix-meetings-widget'
    }`,
    url: 'http://localhost:3000',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },

  /* Start and stop the test setup (e.g. containers) */
  globalSetup: require.resolve('./src/deploy/setup'),
  globalTeardown: require.resolve('./src/deploy/teardown'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],

        // Firefox doesn't recognize pointer capabilities in headless mode on
        // Linux, causing issues by with date pickers in our CI
        // https://github.com/microsoft/playwright/issues/7769
        launchOptions: {
          firefoxUserPrefs: {
            'ui.primaryPointerCapabilities': 0x02 | 0x04,
            'ui.allPointerCapabilities': 0x02 | 0x04,
          },
        },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',
};

export default config;
