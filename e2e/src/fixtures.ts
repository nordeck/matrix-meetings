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

import AxeBuilder from '@axe-core/playwright';
import { Page, test as base, TestInfo, VideoMode } from '@playwright/test';
import {
  BreakoutSessionsPage,
  CockpitWidgetPage,
  ElementWebPage,
  JitsiWidgetPage,
  MeetingsBotApi,
  MeetingsWidgetPage,
} from './pages';
import { getBotUsername, registerUser, User } from './util';

type Fixtures = {
  alice: User;
  alicePage: Page;
  aliceElementWebPage: ElementWebPage;
  aliceMeetingsWidgetPage: MeetingsWidgetPage;
  aliceJitsiWidgetPage: JitsiWidgetPage;
  aliceCockpitWidgetPage: CockpitWidgetPage;
  aliceBreakoutSessionsPage: BreakoutSessionsPage;
  bobBreakoutSessionsPage: BreakoutSessionsPage;
  bob: User;
  charlie: User;
  bobPage: Page;
  bobElementWebPage: ElementWebPage;
  bobMeetingsWidgetPage: MeetingsWidgetPage;
  bobJitsiWidgetPage: JitsiWidgetPage;
  meetingsBotApi: MeetingsBotApi;
  runAxeAnalysis: (page: Page, widgetTitle: string) => Promise<string>;
};

export function shouldCaptureVideo(
  videoMode: VideoMode | 'retry-with-video',
  testInfo: TestInfo
) {
  return (
    videoMode === 'on' ||
    videoMode === 'retain-on-failure' ||
    (videoMode === 'on-first-retry' && testInfo.retry === 1)
  );
}

export const test = base.extend<Fixtures>({
  alice: async ({ page: _ }, use) => {
    const user = await registerUser('Alice');

    await use(user);
  },

  alicePage: async ({ page }, use) => {
    // Just an alias for page
    await use(page);
  },

  aliceElementWebPage: async ({ alicePage, alice }, use) => {
    const elementWebPage = new ElementWebPage(alicePage);
    await elementWebPage.login(alice.username, alice.password);

    await use(elementWebPage);
  },

  aliceMeetingsWidgetPage: async ({ alicePage, aliceElementWebPage }, use) => {
    await aliceElementWebPage.createRoom('Calendar');
    await aliceElementWebPage.inviteUser(getBotUsername());
    await aliceElementWebPage.waitForUserToJoin(getBotUsername());
    await aliceElementWebPage.promoteUserAsModerator(getBotUsername());

    await aliceElementWebPage.approveWidgetWarning();
    await aliceElementWebPage.approveWidgetCapabilities();

    const meetingsWidgetPage = new MeetingsWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('Meetings')
    );

    await meetingsWidgetPage.scheduleMeetingButton.waitFor({
      state: 'attached',
    });

    await use(meetingsWidgetPage);
  },

  aliceJitsiWidgetPage: async ({ aliceElementWebPage }, use) => {
    const jitsiWidgetPage = new JitsiWidgetPage(
      aliceElementWebPage.widgetByTitle('Video Conference')
    );

    await use(jitsiWidgetPage);
  },

  aliceCockpitWidgetPage: async ({ alicePage, aliceElementWebPage }, use) => {
    const cockpitWidgetPage = new CockpitWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('Meeting Controls')
    );

    await use(cockpitWidgetPage);
  },

  aliceBreakoutSessionsPage: async (
    { alicePage, aliceElementWebPage },
    use
  ) => {
    const breakoutSessionsPage = new BreakoutSessionsPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('Breakout Sessions')
    );

    await use(breakoutSessionsPage);
  },

  bob: async ({ page: _ }, use) => {
    const user = await registerUser('Bob');

    await use(user);
  },

  bobPage: async ({ browser, contextOptions, video }, use, testInfo) => {
    // TODO: For some reason we are missing the video in case we are using a
    // second context https://github.com/microsoft/playwright/issues/9002
    // We configure it manually instead.
    const videoMode = typeof video === 'string' ? video : video.mode;
    const videoOptions = shouldCaptureVideo(videoMode, testInfo)
      ? {
          recordVideo: {
            dir: testInfo.outputDir,
            size: typeof video !== 'string' ? video.size : undefined,
          },
        }
      : {};

    const context = await browser.newContext({
      ...contextOptions,
      ...videoOptions,
    });
    const page = await context.newPage();

    try {
      await use(page);
    } finally {
      await context.close();

      const video = page.video();

      if (video) {
        const path = testInfo.outputPath('video-bob.webm');
        await video.saveAs(path);
        testInfo.attach('video', { path, contentType: 'video/webm' });
      }
    }
  },

  bobElementWebPage: async ({ bobPage, bob }, use) => {
    const elementWebPage = new ElementWebPage(bobPage);
    await elementWebPage.login(bob.username, bob.password);

    await use(elementWebPage);
  },

  bobMeetingsWidgetPage: async ({ bobPage, bobElementWebPage }, use) => {
    const meetingsWidgetPage = new MeetingsWidgetPage(
      bobPage,
      bobElementWebPage.widgetByTitle('Meetings')
    );

    await use(meetingsWidgetPage);
  },

  bobJitsiWidgetPage: async ({ bobElementWebPage }, use) => {
    const jitsiWidgetPage = new JitsiWidgetPage(
      bobElementWebPage.widgetByTitle('Video Conference')
    );

    await use(jitsiWidgetPage);
  },

  bobBreakoutSessionsPage: async ({ bobPage, bobElementWebPage }, use) => {
    const breakoutSessionsPage = new BreakoutSessionsPage(
      bobPage,
      bobElementWebPage.widgetByTitle('Breakout Sessions')
    );

    await use(breakoutSessionsPage);
  },

  charlie: async ({ page: _ }, use) => {
    const user = await registerUser('Charlie');

    await use(user);
  },

  meetingsBotApi: async ({ request }, use) => {
    const meetingsBotApi = new MeetingsBotApi(request);

    await use(meetingsBotApi);
  },

  runAxeAnalysis: async ({ page: _ }, use, testInfo) => {
    const fn = async (page: Page, widgetTitle: string) => {
      type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

      function violationFingerprints(accessibilityScanResults: AxeResults) {
        const violationFingerprints = accessibilityScanResults.violations.map(
          (violation) => ({
            rule: violation.id,
            description: violation.description,
            // These are CSS selectors which uniquely identify each element with
            // a violation of the rule in question.
            targets: violation.nodes.map((node) => ({
              target: node.target,
              failureSummary: node.failureSummary,
            })),
          })
        );

        return JSON.stringify(violationFingerprints, null, 2);
      }

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags([
          'wcag2a',
          'wcag2aa',
          'wcag2aaa',
          'wcag21a',
          'wcag21aa',
          'wcag21aaa',
        ])
        .include(`iframe[title="${widgetTitle}"]`)
        .analyze();

      await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json',
      });

      return violationFingerprints(accessibilityScanResults);
    };

    await use(fn);
  },
});
