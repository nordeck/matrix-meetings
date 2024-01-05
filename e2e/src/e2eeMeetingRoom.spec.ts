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

test.describe('Encrypted Meeting Room', () => {
  test.beforeEach(
    async ({
      bob,
      aliceEncryptedMeetingsWidgetPage,
      aliceElementWebPage,
      aliceJitsiWidgetPage,
    }) => {
      test.setTimeout(60000);

      await aliceEncryptedMeetingsWidgetPage.setDateFilter(
        [2040, 10, 1],
        [2040, 10, 8],
      );

      const aliceScheduleMeetingWidgetPage =
        await aliceEncryptedMeetingsWidgetPage.scheduleMeeting();

      await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
      await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
        'My Description',
      );
      await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
      await aliceScheduleMeetingWidgetPage.addParticipant(bob.displayName);
      await aliceScheduleMeetingWidgetPage.submit();

      await aliceElementWebPage.inviteUser(bob.username);

      await aliceElementWebPage.waitForRoomJoin('My Meeting');
      await aliceEncryptedMeetingsWidgetPage
        .getMeeting('My Meeting', '10/03/2040')
        .joinMeeting();
      await aliceJitsiWidgetPage.joinConferenceButton.waitFor();
    },
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
      'My Description',
    );

    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');
    const meetingDetails = aliceCockpitWidgetPage.getMeeting();
    await aliceElementWebPage.approveWidgetIdentity();
    await expect(meetingDetails.meetingDescriptionText).toHaveText(
      'My Description',
    );
    await expect(meetingDetails.meetingTitleText).toHaveText('My Meeting');
    await expect(meetingDetails.meetingTimeRangeText).toHaveText(
      'October 3, 2040, 10:30 – 11:30 AM',
    );
  });

  test('should edit the meeting title from within the meeting', async ({
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');

    const meetingDetails = aliceCockpitWidgetPage.getMeeting();
    await aliceElementWebPage.approveWidgetIdentity();
    const aliceEditMeetingWidgetPage = await meetingDetails.editMeeting();
    await aliceEditMeetingWidgetPage.titleTextbox.fill('New Meeting');
    await aliceEditMeetingWidgetPage.submit();

    await expect(meetingDetails.meetingTitleText).toHaveText('New Meeting');
    await expect(aliceElementWebPage.roomNameText).toHaveText('New Meeting');
    await expect(
      aliceElementWebPage.locateChatMessageInRoom(/Title: New Meeting/),
    ).toBeVisible();
  });
});
