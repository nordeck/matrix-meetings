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

test.describe('Recurring Meetings', () => {
  test('should schedule recurring meeting', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
    aliceCockpitWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');

    await aliceElementWebPage.switchToRoom('My Meeting');

    await aliceElementWebPage.showWidgetInSidebar('Meeting Controls');

    await expect(
      aliceCockpitWidgetPage.getMeeting().meetingTimeRangeText
    ).toHaveText(
      'Oct 3, 2040, 10:30 AM – 11:30 AM. Recurrence: Every day for 5 times'
    );
  });

  test('should show meeting recurrences in meeting list', async ({
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
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card
    ).toHaveCount(5);
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/05/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/06/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/07/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
  });

  test('should show meeting recurrences in month view', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 8]);
    await aliceMeetingsWidgetPage.switchView('month');

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting')
    ).toHaveCount(5);
  });

  test('should edit recurring meeting', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM. Recurrence: Every day for 5 times'
    );

    const aliceEditMeetingWidgetPage = await meeting.editMeeting();
    await aliceEditMeetingWidgetPage.setStart([2040, 10, 4], '11:00 AM');
    await aliceEditMeetingWidgetPage.selectRecurrence('custom');
    await aliceEditMeetingWidgetPage.selectRecurrenceFrequency('weeks');
    await aliceEditMeetingWidgetPage
      .getRecurrenceWeekdayButton('Monday')
      .click();
    await aliceEditMeetingWidgetPage
      .getRecurrenceWeekdayButton('Tuesday')
      .click();
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText
    ).toHaveText(
      '11:00 AM – 12:00 PM. Recurrence: Every week on Monday, Tuesday, and Thursday for 30 times'
    );

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card
    ).toHaveCount(3);
  });

  test('should covert a recurring meeting into a single meeting', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM. Recurrence: Every day for 5 times'
    );

    const aliceEditMeetingWidgetPage = await meeting.editMeeting();
    await aliceEditMeetingWidgetPage.selectRecurrence('no repetition');
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card
    ).toHaveCount(1);
  });

  test('should convert a single meeting into a recurring meeting', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM'
    );

    const aliceEditMeetingWidgetPage = await meeting.editMeeting();
    await aliceEditMeetingWidgetPage.selectRecurrence('daily');
    await aliceEditMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText
    ).toHaveText('10:30 AM – 11:30 AM');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card
    ).toHaveCount(5);
  });

  // TODO: Edit single meeting

  // TODO: Edit starting from

  test('should delete recurring meeting', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description'
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    const meeting = aliceMeetingsWidgetPage.getMeeting(
      'My Meeting',
      '10/03/2040'
    );
    await expect(meeting.meetingTimeRangeText).toHaveText(
      '10:30 AM – 11:30 AM. Recurrence: Every day for 5 times'
    );
    await meeting.deleteMeeting();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card
    ).toHaveCount(0);
  });

  // TODO: Delete single meeting

  // TODO: Delete starting from
});
