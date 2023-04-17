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

test.describe('OpenXchange', () => {
  test('should create meeting via OX', async ({
    alice,
    alicePage,
    aliceElementWebPage,
    aliceJitsiWidgetPage,
    aliceCockpitWidgetPage,
    meetingsBotApi,
  }) => {
    const { meetingUrl } = await meetingsBotApi.createMeeting({
      title: 'My Meeting',
      description: 'My Description',
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
      participants: [alice.username],
    });

    await alicePage.goto(meetingUrl);

    const inviteReasonText = await aliceElementWebPage.revealRoomInviteReason();
    await expect(inviteReasonText).toContainText(
      'The meeting was created for you. It will take place on 10/03/2040 at 10:30 AM CEST.'
    );
    await expect(inviteReasonText).toContainText('My Description');
    await aliceElementWebPage.acceptRoomInvitation();

    await expect(aliceElementWebPage.roomNameText).toHaveText('My Meeting');
    await expect(aliceElementWebPage.roomTopicText).toHaveText(
      'My Description'
    );
    await expect(aliceJitsiWidgetPage.joinConferenceButton).toBeVisible();

    await aliceElementWebPage.showWidgetInSidebar('Meeting Controls');

    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await expect(meetingCard.meetingTitleText).toHaveText('My Meeting');
    await expect(meetingCard.meetingDescriptionText).toHaveText(
      'My Description'
    );
    await expect(meetingCard.meetingTimeRangeText).toHaveText(
      'Oct 3, 2040, 10:30 AM – 11:00 AM'
    );

    const menu = await meetingCard.openMoreSettingsMenu();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(menu.editInOpenXchangeMenuItem).toHaveAttribute(
      'href',
      'https://webmail-hostname/appsuite/#app=io.ox/calendar&id=meeting-id&folder=cal://0/471'
    );
    await expect(menu.deleteInOpenXchangeMenuItem).toHaveAttribute(
      'href',
      'https://webmail-hostname/appsuite/#app=io.ox/calendar&id=meeting-id&folder=cal://0/471'
    );

    expect(await aliceElementWebPage.getWidgets()).toEqual([
      'Breakout Sessions',
      'Meeting Controls',
      'Video Conference',
    ]);
  });

  test('should update meeting via OX', async ({
    alice,
    alicePage,
    aliceElementWebPage,
    aliceCockpitWidgetPage,
    meetingsBotApi,
  }) => {
    const { meetingUrl, roomId } = await meetingsBotApi.createMeeting({
      title: 'My Meeting',
      description: 'My Description',
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
      participants: [alice.username],
    });

    await alicePage.goto(meetingUrl);
    await aliceElementWebPage.acceptRoomInvitation();

    await aliceElementWebPage.showWidgetInSidebar('Meeting Controls');

    const meetingCard = aliceCockpitWidgetPage.getMeeting();
    await expect(meetingCard.meetingTimeRangeText).toHaveText(
      'Oct 3, 2040, 10:30 AM – 11:00 AM'
    );

    await meetingsBotApi.updateMeeting({
      roomId,
      startTime: '2040-10-04T10:30:00.000+02:00',
      endTime: '2040-10-04T11:00:00.000+02:00',
      title: 'My Meeting',
      description: 'My Description',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
    });

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /10\/04\/2040 10:30 AM CEST to 10\/04\/2040 11:00 AM CEST/
      )
    ).toBeVisible();

    await expect(meetingCard.meetingTimeRangeText).toHaveText(
      'Oct 4, 2040, 10:30 AM – 11:00 AM'
    );
  });

  test('should update meeting via OX and update invitation state', async ({
    alice,
    alicePage,
    aliceElementWebPage,
    meetingsBotApi,
  }) => {
    const { meetingUrl, roomId } = await meetingsBotApi.createMeeting({
      title: 'My Meeting',
      description: 'My Description',
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
      participants: [alice.username],
    });

    await alicePage.goto(meetingUrl);

    const inviteReasonText = await aliceElementWebPage.revealRoomInviteReason();
    await expect(inviteReasonText).toContainText(
      'The meeting was created for you. It will take place on 10/03/2040 at 10:30 AM CEST.'
    );
    await expect(aliceElementWebPage.roomInviteHeader).toHaveText(
      'Do you want to join My Meeting?'
    );

    await meetingsBotApi.updateMeeting({
      roomId,
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      title: 'My new Meeting',
      description: 'My new Description',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
    });

    await expect(inviteReasonText).toContainText('My new Description');
    await expect(aliceElementWebPage.roomInviteHeader).toHaveText(
      /My new Meeting/
    );
  });

  test('should delete meeting via OX with tombstone', async ({
    alice,
    aliceElementWebPage,
    aliceJitsiWidgetPage,
    aliceMeetingsWidgetPage,
    meetingsBotApi,
  }) => {
    const parentRoomId = aliceElementWebPage.getCurrentRoomId();
    const { roomId } = await meetingsBotApi.createMeeting({
      parentRoomId,
      title: 'My Meeting',
      description: 'My Description',
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
      participants: [alice.username],
    });

    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:00 AM');

    await aliceElementWebPage.switchToRoom('My Meeting');

    await expect(aliceJitsiWidgetPage.joinConferenceButton).toBeVisible();

    await meetingsBotApi.deleteMeeting({
      roomId,
      method: 'tombstone',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
    });

    await expect(aliceElementWebPage.locateTombstone()).toBeVisible();
  });

  test('should delete meeting via OX with kick_all_participants', async ({
    alice,
    alicePage,
    aliceElementWebPage,
    meetingsBotApi,
  }) => {
    const { meetingUrl, roomId } = await meetingsBotApi.createMeeting({
      title: 'My Meeting',
      description: 'My Description',
      startTime: '2040-10-03T10:30:00.000+02:00',
      endTime: '2040-10-03T11:00:00.000+02:00',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
      participants: [alice.username],
    });

    await alicePage.goto(meetingUrl);
    await aliceElementWebPage.acceptRoomInvitation();

    await meetingsBotApi.deleteMeeting({
      roomId,
      method: 'kick_all_participants',
      openIdToken: await aliceElementWebPage.getOpenIdToken(),
    });

    await expect(aliceElementWebPage.userKickMessageHeader).toBeVisible();
  });
});
