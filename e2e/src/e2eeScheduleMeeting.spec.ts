/*
 * Copyright 2024 Nordeck IT + Consulting GmbH
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

test.describe('Schedule Encrypted Meeting', () => {
  test('should schedule an encrypted meeting room and join automatically', async ({
    aliceElementWebPage,
    aliceEncryptedMeetingsWidgetPage,
    aliceJitsiWidgetPage,
  }) => {
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
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceEncryptedMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM');

    await aliceElementWebPage.switchToRoom('My Meeting');

    await expect(aliceJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });

  test('should schedule an encrypted meeting and invite a second user', async ({
    aliceElementWebPage,
    aliceEncryptedMeetingsWidgetPage,
    bob,
    bobElementWebPage,
    bobMeetingsWidgetPage,
    bobJitsiWidgetPage,
  }) => {
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
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(2);
    await aliceScheduleMeetingWidgetPage.addParticipant(bob.displayName);
    await aliceScheduleMeetingWidgetPage.submit();

    await aliceElementWebPage.inviteUser(bob.username);

    await expect(
      aliceEncryptedMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 2 times', {
      timeout: 30000,
    });

    await bobElementWebPage.navigateToRoomOrInvitation('Calendar');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await bobMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();

    const inviteReason = await bobElementWebPage.revealRoomInviteReason();

    await expect(inviteReason).toContainText(
      '📅 10/3/2040, 10:30 – 11:30 AM GMT+2',
    );
    await expect(inviteReason).toContainText(
      '🔁 Recurrence: Every day for 2 times',
    );
    await expect(inviteReason).toContainText(
      "you've been invited to a meeting by Alice",
    );
    await expect(inviteReason).toContainText('My Description');

    await bobElementWebPage.acceptRoomInvitation();
    await expect(bobJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });

  test('should invite the second user via a link to an encrypted meeting', async ({
    aliceElementWebPage,
    aliceEncryptedMeetingsWidgetPage,
    bobPage,
    bobElementWebPage,
    bobJitsiWidgetPage,
  }) => {
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
    await aliceScheduleMeetingWidgetPage.submit();

    const aliceMeeting = aliceEncryptedMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040',
    );

    await expect(aliceMeeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM',
    );

    await aliceMeeting.switchToShareMeeting();
    await aliceElementWebPage.approveWidgetIdentity();
    const meetingLink = await aliceMeeting.getShareLink();

    await bobPage.goto(meetingLink);
    await bobElementWebPage.joinRoom();
    await expect(bobJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });
});
