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

    await aliceElementWebPage.showWidgetInSidebar('NeoDateFix Details');

    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceCockpitWidgetPage.getMeeting().meetingTimeRangeText,
    ).toHaveText('October 3, 2040, 10:30 – 11:30 AM');

    await expect(
      aliceCockpitWidgetPage.getMeeting().meetingRecurrenceRuleText,
    ).toHaveText('Every day for 5 times');
  });

  test('should show meeting recurrences in meeting list', async ({
    aliceMeetingsWidgetPage,
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
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(5);
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/05/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/06/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/07/2040')
        .meetingTimeRangeText,
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
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.selectRecurrence('daily');
    await aliceScheduleMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceScheduleMeetingWidgetPage.submit();

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
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
        .meetingTimeRangeText,
    ).toHaveText(
      '11:00 AM – 12:00 PM. Recurrence: Every week on Monday, Tuesday, and Thursday for 30 times',
    );

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(3);

    await aliceElementWebPage.navigateToRoomOrInvitation('My Meeting');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Repeat meeting: Every week on Monday, Tuesday, and Thursday for 30 times/,
      ),
    ).toBeVisible();

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /\(previously: Every day for 5 times\)/,
      ),
    ).toBeVisible();
  });

  test('should edit one instance of the recurring meeting', async ({
    aliceMeetingsWidgetPage,
    aliceElementWebPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

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
    await aliceEditMeetingWidgetPage.setStart([2040, 10, 9], '10:40 AM');
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/09/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:40 AM – 11:40 AM. Recurrence: Every day for 5 times');

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/04/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM. Recurrence: Every day for 5 times');

    await aliceElementWebPage.switchToRoom('My Meeting');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /A single meeting from a meeting series is moved to October 9, 2040, 10:40 – 11:40 AM GMT\+2/,
      ),
    ).toBeVisible();

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /\(previously: October 3, 2040, 10:30 – 11:30 AM GMT\+2/,
      ),
    ).toBeVisible();
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
    await aliceEditMeetingWidgetPage.selectRecurrence('no repetition');
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(1);

    await aliceElementWebPage.navigateToRoomOrInvitation('My Meeting');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Repeat meeting: No repetition/,
      ),
    ).toBeVisible();

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /\(previously: Every day for 5 times\)/,
      ),
    ).toBeVisible();
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
    await aliceEditMeetingWidgetPage.selectRecurrence('daily');
    await aliceEditMeetingWidgetPage.setEndAfterMeetingCount(5);
    await aliceEditMeetingWidgetPage.submit();
    await aliceElementWebPage.approveWidgetIdentity();

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040')
        .meetingTimeRangeText,
    ).toHaveText('10:30 AM – 11:30 AM');
    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(5);

    await aliceElementWebPage.navigateToRoomOrInvitation('My Meeting');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /Repeat meeting: Every day for 5 times/,
      ),
    ).toBeVisible();

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /\(previously: No repetition\)/,
      ),
    ).toBeVisible();
  });

  // TODO: Edit starting from

  test('should delete recurring meeting', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

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
    await meeting.deleteMeeting('Delete series');

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(0);
  });

  test('should delete a single recurring meeting', async ({
    aliceElementWebPage,
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 1], [2040, 10, 9]);

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
    await meeting.deleteMeeting('Delete meeting');

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting', '10/03/2040').card,
    ).toHaveCount(0);

    await expect(
      aliceMeetingsWidgetPage.getMeeting('My Meeting').card,
    ).toHaveCount(4);

    await aliceElementWebPage.switchToRoom('My Meeting');

    await expect(
      aliceElementWebPage.locateChatMessageInRoom(
        /A single meeting from a meeting series on October 3, 2040, 10:30 – 11:30 AM GMT\+2 is deleted/,
      ),
    ).toBeVisible();
  });

  // TODO: Delete starting from
});
