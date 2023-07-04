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

test.describe('Meeting Room', () => {
  test.beforeEach(
    async ({
      bob,
      aliceMeetingsWidgetPage,
      aliceElementWebPage,
      aliceJitsiWidgetPage,
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
      await aliceScheduleMeetingWidgetPage.submit();

      await aliceElementWebPage.inviteUser(bob.username);

      await aliceElementWebPage.waitForRoomJoin('My Meeting');
      await aliceMeetingsWidgetPage
        .getMeeting('My Meeting', '10/03/2040')
        .joinMeeting();
      await aliceJitsiWidgetPage.joinConferenceButton.waitFor();
    }
  );

  test('should have jitsi, breakout sessions, and settings widget setup in the room', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    expect(await aliceElementWebPage.getWidgets()).toEqual([
      'Breakout Sessions',
      'NeoDateFix Details',
      'Video Conference',
    ]);

    await expect(aliceElementWebPage.roomNameText).toHaveText('My Meeting');
    await expect(aliceElementWebPage.roomTopicText).toHaveText(
      'My Description'
    );

    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await expect(meetingCard.meetingTimeRangeText).toHaveText(
      'Oct 3, 2040, 10:30 AM – 11:30 AM'
    );
    await expect(meetingCard.meetingTitleText).toHaveText('My Meeting');
    await expect(meetingCard.meetingDescriptionText).toHaveText(
      'My Description'
    );
  });

  test('should edit the meeting title from within the meeting', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');

    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    const aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.titleTextbox.fill('New Meeting');
    await aliceEditMeetingWidgetPage.submit();

    await aliceElementWebPage.approveWidgetIdentity();

    await expect(meetingCard.meetingTitleText).toHaveText('New Meeting');
    await expect(aliceElementWebPage.roomNameText).toHaveText('New Meeting');
    await expect(
      aliceElementWebPage.locateChatMessageInRoom(/Title: New Meeting/)
    ).toBeVisible();
  });

  test('should add the meeting participant from within the meeting', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
    charlie,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');

    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    const aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.addParticipant(charlie.displayName);
    await aliceEditMeetingWidgetPage.submit();

    await aliceElementWebPage.approveWidgetIdentity();

    await aliceElementWebPage.waitForUserMembership(charlie.username, 'invite');
  });

  test('should disable the video conference from within the meeting', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    const aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.removeLastWidget();
    await aliceEditMeetingWidgetPage.submit();

    await aliceElementWebPage.approveWidgetIdentity();

    await aliceElementWebPage
      .locateChatMessageInRoom('Video conference ended by Bot')
      .waitFor();

    await aliceElementWebPage.closeWidgetInSidebar();

    await expect
      .poll(async () => {
        return await aliceElementWebPage.getWidgets();
      })
      .toEqual(['Breakout Sessions', 'NeoDateFix Details']);
  });

  test('should enable the optional widget from within the meeting', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    const aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.addWidget('Video Conference (optional)');
    await aliceEditMeetingWidgetPage.submit();

    await aliceElementWebPage.approveWidgetIdentity();

    await expect
      .poll(async () => {
        return await aliceElementWebPage.getWidgets();
      })
      .toEqual([
        'Breakout Sessions',
        'NeoDateFix Details',
        'Video Conference',
        'Video Conference (optional)',
      ]);
  });

  test('should toggle whether users can use the chat', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
    bobElementWebPage,
    bobMeetingsWidgetPage,
  }) => {
    await bobElementWebPage.navigateToRoomOrInvitation('Calendar');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await bobMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.sendMessage('I am Bob');
    await aliceElementWebPage.sendMessage('I am Alice');
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    let aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.toggleChatPermission();
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();
    await aliceElementWebPage.sendMessage('I am still here');
    await expect(bobElementWebPage.noChatPermissionText).toBeVisible();
    aliceEditMeetingWidgetPage = await meetingCard.editMeeting();
    await aliceEditMeetingWidgetPage.toggleChatPermission();
    await aliceEditMeetingWidgetPage.submit();
    await expect(bobElementWebPage.noChatPermissionText).toBeHidden();
    await bobElementWebPage.sendMessage('I am Bob again');
    await aliceElementWebPage.sendMessage('I am Alice again');
  });

  test('should cancel the meeting', async ({
    aliceElementWebPage,
    bobElementWebPage,
    aliceCockpitWidgetPage,
    aliceMeetingsWidgetPage,
    bobMeetingsWidgetPage,
  }) => {
    await bobElementWebPage.navigateToRoomOrInvitation('Calendar');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await bobMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();
    await bobElementWebPage.acceptRoomInvitation();
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await meetingCard.deleteMeeting();

    await expect(aliceElementWebPage.locateTombstone()).toBeVisible();
    await expect(bobElementWebPage.locateTombstone()).toBeVisible();

    await aliceElementWebPage.followTombstone();
    await bobElementWebPage.followTombstone();

    await aliceElementWebPage.approveWidgetCapabilities();
    await bobElementWebPage.approveWidgetCapabilities();

    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await expect(aliceMeetingsWidgetPage.meetingsEmptyListItem).toBeVisible();
    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await expect(bobMeetingsWidgetPage.meetingsEmptyListItem).toBeVisible();
  });

  test('should navigate to the parent room', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    await aliceCockpitWidgetPage.backToParentRoom();
    await aliceElementWebPage.approveWidgetCapabilities();

    await expect(aliceElementWebPage.roomNameText).toHaveText('Calendar');
    expect(await aliceElementWebPage.getWidgets()).toEqual(['NeoDateFix']);
  });
});
