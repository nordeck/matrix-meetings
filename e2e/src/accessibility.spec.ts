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

import { expect } from '@playwright/test';
import { test } from './fixtures';

test.describe('Accessibility', () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    // Disable platform and browser specific snapshots suffixed. The results are
    // independent from the platform.
    testInfo.snapshotSuffix = '';
  });

  test('empty meeting list should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.scheduleMeetingButton.waitFor();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting list should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3], [2040, 10, 10]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .card.waitFor();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting calendar day view should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage.switchView('day');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting')
    ).toBeVisible();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting calendar week view should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage.switchView('week');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting')
    ).toBeVisible();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting calendar work week view should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage.switchView('work week');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting')
    ).toBeVisible();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting calendar month view should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage.switchView('month');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting')
    ).toBeVisible();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('meeting calendar details view should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceMeetingsWidgetPage.switchView('work week');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    const meetingDetails =
      await aliceMeetingsWidgetPage.openCalendarEventDetails('My Meeting');

    await meetingDetails.meetingDetails.meetingTitleText.waitFor();

    expect(await runAxeAnalysis(alicePage, 'NeoDateFix')).toMatchSnapshot();
  });

  test('schedule meeting dialog should not have automatically detectable accessibility violations', async ({
    alicePage,
    aliceMeetingsWidgetPage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.scheduleMeeting();

    expect(
      await runAxeAnalysis(alicePage, 'Schedule Meeting')
    ).toMatchSnapshot();
  });

  test('meeting settings should not have automatically detectable accessibility violations', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
    aliceMeetingsWidgetPage,
    alicePage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceElementWebPage.waitForRoomJoin('My Meeting');
    await aliceMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await aliceElementWebPage.waitForRoom('My Meeting');
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await meetingCard.meetingTitleText.waitFor();
    expect(
      await runAxeAnalysis(alicePage, 'NeoDateFix Details')
    ).toMatchSnapshot();
  });

  test('empty breakout sessions list should not have automatically detectable accessibility violations', async ({
    aliceBreakoutSessionsPage,
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
    alicePage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceElementWebPage.waitForRoomJoin('My Meeting');
    await aliceMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await aliceElementWebPage.waitForRoom('My Meeting');
    await aliceElementWebPage.showWidgetInSidebar('Breakout Sessions');
    await aliceBreakoutSessionsPage.scheduleBreakoutSessionsButton.waitFor();

    expect(
      await runAxeAnalysis(alicePage, 'Breakout Sessions')
    ).toMatchSnapshot();
  });

  test('breakout sessions list should not have automatically detectable accessibility violations', async ({
    aliceBreakoutSessionsPage,
    aliceMeetingsWidgetPage,
    bob,
    charlie,
    aliceElementWebPage,
    alicePage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.addParticipant(bob.displayName);
    await aliceScheduleMeetingWidgetPage.addParticipant(charlie.displayName);
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceElementWebPage.inviteUser(bob.username);
    await aliceElementWebPage.inviteUser(charlie.username);

    await aliceElementWebPage.waitForRoomJoin('My Meeting');
    await aliceMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await aliceElementWebPage.waitForRoom('My Meeting');
    await aliceElementWebPage.showWidgetInSidebar('Breakout Sessions');

    const aliceScheduleBreakoutSessionWidgetPage =
      await aliceBreakoutSessionsPage.scheduleBreakoutSession();
    await aliceScheduleBreakoutSessionWidgetPage.setStartAndEndTime(
      '10:30 AM',
      '10:40 AM'
    );
    // For some reason the test fails to enter the description if we enter it
    // first (firefox only?)
    await aliceScheduleBreakoutSessionWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleBreakoutSessionWidgetPage.groupNumberSnipButton.fill(
      '2'
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      bob.displayName,
      'Group 1'
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      charlie.displayName,
      'Group 2'
    );
    await aliceScheduleBreakoutSessionWidgetPage.createBreakoutSessions();

    await aliceBreakoutSessionsPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await aliceBreakoutSessionsPage
      .getBreakoutSession('Group 1')
      .card.waitFor();

    expect(
      await runAxeAnalysis(alicePage, 'Breakout Sessions')
    ).toMatchSnapshot();
  });

  test('create breakout sessions dialog should not have automatically detectable accessibility violations', async ({
    aliceBreakoutSessionsPage,
    aliceMeetingsWidgetPage,
    bob,
    charlie,
    aliceElementWebPage,
    alicePage,
    runAxeAnalysis,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();
    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.addParticipant(bob.displayName);
    await aliceScheduleMeetingWidgetPage.addParticipant(charlie.displayName);
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceElementWebPage.inviteUser(bob.username);
    await aliceElementWebPage.inviteUser(charlie.username);

    await aliceElementWebPage.waitForRoomJoin('My Meeting');
    await aliceMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await aliceElementWebPage.waitForRoom('My Meeting');

    await aliceElementWebPage.showWidgetInSidebar('Breakout Sessions');

    await aliceBreakoutSessionsPage.scheduleBreakoutSession();

    expect(
      await runAxeAnalysis(alicePage, 'Schedule Breakout Session')
    ).toMatchSnapshot();
  });
});
