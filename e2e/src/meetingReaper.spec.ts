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

test.describe('Meeting Reaper', () => {
  test('schedule meeting deletion after meeting end', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM');

    await aliceElementWebPage.switchToRoom('My Meeting');

    expect(await aliceElementWebPage.getMeetingRoomForceDeletionAt()).toEqual(
      '2040-10-03T10:30:00.000Z', // 60 minutes after the end time
    );
  });

  test('schedule meeting deletion after recurring meeting end', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');

    await aliceElementWebPage.switchToRoom('My Meeting');

    expect(await aliceElementWebPage.getMeetingRoomForceDeletionAt()).toEqual(
      '2040-10-07T10:30:00.000Z', // 60 minutes after the end time
    );
  });

  test('reschedule meeting deletion after meeting end after editing', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040',
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM',
    );

    const aliceEditMeetingWidgetPage = await meeting.editMeeting();
    await aliceEditMeetingWidgetPage.setStart([2040, 10, 4], '11:00 AM');
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText,
    ).toHaveText('11:00 AM – 12:00 PM');

    await aliceElementWebPage.switchToRoom('My Meeting');

    expect(await aliceElementWebPage.getMeetingRoomForceDeletionAt()).toEqual(
      '2040-10-04T11:00:00.000Z', // 60 minutes after the end time
    );
  });

  test('reschedule meeting deletion after recurring meeting end after editing', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040',
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM. Recurrence: Every day for 5 times',
    );

    const aliceEditMeetingWidgetPage = await meeting.editMeeting();
    await aliceEditMeetingWidgetPage.toggleRecurringEdit();
    await aliceEditMeetingWidgetPage.setStart([2040, 10, 4], '11:00 AM');
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText,
    ).toHaveText('11:00 AM – 12:00 PM. Recurrence: Every day for 5 times');

    await aliceElementWebPage.switchToRoom('My Meeting');

    expect(await aliceElementWebPage.getMeetingRoomForceDeletionAt()).toEqual(
      '2040-10-08T11:00:00.000Z', // 60 minutes after the end time
    );
  });
});
