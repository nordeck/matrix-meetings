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

test.describe('Schedule Breakout Sessions', () => {
  test.beforeEach(
    async ({ bob, charlie, aliceMeetingsWidgetPage, aliceElementWebPage }) => {
      await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

      const aliceScheduleMeetingWidgetPage =
        await aliceMeetingsWidgetPage.scheduleMeeting();

      await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
      await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
        'My Description',
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
    },
  );

  test('should create breakout sessions for the meeting', async ({
    charlie,
    bob,
    bobElementWebPage,
    bobMeetingsWidgetPage,
    aliceElementWebPage,
    aliceCockpitWidgetPage,
    aliceBreakoutSessionsPage,
    bobBreakoutSessionsPage,
  }, testInfo) => {
    // Increase the timeout for this test as it's quite heavy with two devices
    test.setTimeout(testInfo.timeout * 1.5);

    await bobElementWebPage.navigateToRoomOrInvitation('Calendar');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();
    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await bobMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await bobElementWebPage.acceptRoomInvitation();

    const aliceScheduleBreakoutSessionWidgetPage =
      await aliceBreakoutSessionsPage.scheduleBreakoutSession();

    await aliceScheduleBreakoutSessionWidgetPage.setStartAndEndTime(
      '10:30 AM',
      '10:40 AM',
    );
    // For some reason the test fails to enter the description if we enter it
    // first (firefox only?)
    await aliceScheduleBreakoutSessionWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleBreakoutSessionWidgetPage.groupNumberSnipButton.fill(
      '2',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      bob.displayName,
      'Group 1',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      charlie.displayName,
      'Group 2',
    );
    await aliceScheduleBreakoutSessionWidgetPage.createBreakoutSessions();

    await aliceBreakoutSessionsPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession('Group 1')
        .meetingDescriptionText,
    ).toHaveText('My Description');

    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession('Group 2')
        .meetingDescriptionText,
    ).toHaveText('My Description');

    await aliceElementWebPage.switchToRoom('Group 1');
    await aliceElementWebPage.sendMessage('Alice in breakout session room');

    expect(await aliceElementWebPage.getWidgets()).toEqual([
      'NeoDateFix Details',
      'Video Conference',
    ]);

    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await expect(meetingCard.meetingTitleText).toHaveText('Group 1');
    await expect(meetingCard.meetingDescriptionText).toHaveText(
      'My Description',
    );

    await bobElementWebPage.showWidgetInSidebar('Breakout Sessions');
    await bobBreakoutSessionsPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await bobElementWebPage.navigateToRoomOrInvitation('Group 1');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.sendMessage('Bob in breakout session room');

    expect(await bobElementWebPage.getWidgets()).toEqual([
      'NeoDateFix Details',
      'Video Conference',
    ]);
  });

  test('should create breakout sessions with the longest title and description', async ({
    charlie,
    bob,
    aliceBreakoutSessionsPage,
  }) => {
    const aliceScheduleBreakoutSessionWidgetPage =
      await aliceBreakoutSessionsPage.scheduleBreakoutSession();

    await aliceScheduleBreakoutSessionWidgetPage.setStartAndEndTime(
      '10:30 AM',
      '10:40 AM',
    );
    // For some reason the test fails to enter the description if we enter it
    // first (firefox only?)
    await aliceScheduleBreakoutSessionWidgetPage.descriptionTextbox.fill(
      'My Description' + '+'.repeat(100000),
    );
    await aliceScheduleBreakoutSessionWidgetPage.groupNumberSnipButton.fill(
      '2',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      bob.displayName,
      'Group 1',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      charlie.displayName,
      'Group 2',
    );
    await aliceScheduleBreakoutSessionWidgetPage
      .getGroupTitleTextbox('Group 1')
      .fill('Group 1' + '+'.repeat(100000));
    await aliceScheduleBreakoutSessionWidgetPage
      .getGroupTitleTextbox('Group 2')
      .fill('Group 2' + '+'.repeat(100000));
    await aliceScheduleBreakoutSessionWidgetPage.createBreakoutSessions();

    await aliceBreakoutSessionsPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession(
        'Group 1' + '+'.repeat(255 - 'Group 1'.length),
      ).meetingDescriptionText,
    ).toHaveText(
      'My Description' + '+'.repeat(20000 - 'My Description'.length),
      { timeout: 30000 },
    );

    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession(
        'Group 2' + '+'.repeat(255 - 'Group 2'.length),
      ).meetingDescriptionText,
    ).toHaveText(
      'My Description' + '+'.repeat(20000 - 'My Description'.length),
      { timeout: 30000 },
    );
  });

  test('should send a message to all breakout sessions', async ({
    charlie,
    bob,
    aliceBreakoutSessionsPage,
    aliceElementWebPage,
  }) => {
    const aliceScheduleBreakoutSessionWidgetPage =
      await aliceBreakoutSessionsPage.scheduleBreakoutSession();
    await aliceScheduleBreakoutSessionWidgetPage.setStartAndEndTime(
      '10:30 AM',
      '10:40 AM',
    );
    // For some reason the test fails to enter the description if we enter it
    // first (firefox only?)
    await aliceScheduleBreakoutSessionWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleBreakoutSessionWidgetPage.groupNumberSnipButton.fill(
      '2',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      charlie.displayName,
      'Group 1',
    );
    await aliceScheduleBreakoutSessionWidgetPage.addParticipantToGroup(
      bob.displayName,
      'Group 2',
    );
    await aliceScheduleBreakoutSessionWidgetPage.createBreakoutSessions();

    await aliceBreakoutSessionsPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession('Group 1')
        .meetingDescriptionText,
    ).toHaveText('My Description', { timeout: 30000 });
    await expect(
      aliceBreakoutSessionsPage.getBreakoutSession('Group 2')
        .meetingDescriptionText,
    ).toHaveText('My Description', { timeout: 30000 });

    await aliceBreakoutSessionsPage.sendMessageToAllBreakoutSession(
      'Alice says hi to all breakout session rooms',
    );
    await aliceElementWebPage.switchToRoom('Group 1');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Alice says hi to all breakout session rooms/,
      ),
    ).toBeVisible();

    await aliceElementWebPage.switchToRoom('Group 2');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Alice says hi to all breakout session rooms/,
      ),
    ).toBeVisible();
  });
});
