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

test.describe('Schedule Meeting', () => {
  test('should schedule a meeting and join the room automatically', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
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
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM');

    await aliceElementWebPage.switchToRoom('My Meeting');

    await expect(aliceJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });

  test('should reschedule the meeting to a different day', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
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

    const meetingCardPage = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );
    await expect(meetingCardPage.card).toBeVisible();

    const editMeetingWidgetPage = await meetingCardPage.editMeeting();
    await editMeetingWidgetPage.setStart([2040, 8, 24], '10:30 AM');
    await editMeetingWidgetPage.submit();

    await aliceElementWebPage.approveWidgetIdentity();

    await aliceMeetingsWidgetPage.setDateFilter([2040, 8, 24], [2040, 9, 1]);

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '08/24/2040').card
    ).toBeVisible();
  });

  test('should schedule a meeting and invite a second user', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
    bob,
    bobElementWebPage,
    bobMeetingsWidgetPage,
    bobJitsiWidgetPage,
  }) => {
    await aliceElementWebPage.inviteUser(bob.username);

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

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM');

    await bobElementWebPage.navigateToRoomOrInvitation('Calendar');
    await bobElementWebPage.acceptRoomInvitation();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    await bobMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await bobMeetingsWidgetPage
      .getMeeting('My Meeting', '10/03/2040')
      .joinMeeting();

    const inviteReason = await bobElementWebPage.revealRoomInviteReason();

    await expect(inviteReason).toContainText('invited to a meeting by Alice');
    // Having the times returned in CET might be a bit unintuitive for users and
    // could be an improvement for the future.
    await expect(inviteReason).toContainText('10/03/2040 at 10:30 AM CEST');
    await expect(inviteReason).toContainText('10/03/2040 at 11:30 AM CEST');
    await expect(inviteReason).toContainText('My Description');

    await bobElementWebPage.acceptRoomInvitation();
    await expect(bobJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });

  test('should invite the second user via a link', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
    bobPage,
    bobElementWebPage,
    bobJitsiWidgetPage,
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

    const aliceMeeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );

    await expect(aliceMeeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM'
    );

    await aliceMeeting.switchToShareMeeting();
    await aliceElementWebPage.approveWidgetIdentity();
    const meetingLink = await aliceMeeting.getShareLink();

    await bobPage.goto(meetingLink);
    await bobElementWebPage.joinRoom();
    await expect(bobJitsiWidgetPage.joinConferenceButton).toBeVisible();
  });
});
