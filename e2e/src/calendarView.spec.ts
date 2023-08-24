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

test.describe('Calendar View', () => {
  test.beforeEach(async ({ aliceMeetingsWidgetPage }) => {
    const aliceScheduleMeetingWidgetPage =
      await aliceMeetingsWidgetPage.scheduleMeeting();

    await aliceScheduleMeetingWidgetPage.titleTextbox.fill('My Meeting');
    await aliceScheduleMeetingWidgetPage.descriptionTextbox.fill(
      'My Description',
    );
    await aliceScheduleMeetingWidgetPage.setStart([2040, 10, 3], '10:30 AM');
    await aliceScheduleMeetingWidgetPage.submit();
  });

  test.afterEach(async ({ alicePage }) => {
    await alicePage.setViewportSize({ width: 1280, height: 720 });
  });

  test('should show meetings in day view', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.switchView('day');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
    ).toBeVisible();

    const meetingDetails =
      await aliceMeetingsWidgetPage.openCalendarEventDetails('My Meeting');
    await expect(meetingDetails.meetingDetails.meetingTitleText).toHaveText(
      'My Meeting',
    );
    await expect(
      meetingDetails.meetingDetails.meetingDescriptionText,
    ).toHaveText('My Description');
    await meetingDetails.close();

    await expect(meetingDetails.meetingDetails.meetingDetailsView).toBeHidden();
  });

  test('should show meetings in week view', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.switchView('week');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
    ).toBeVisible();

    const meetingDetails =
      await aliceMeetingsWidgetPage.openCalendarEventDetails('My Meeting');
    await expect(meetingDetails.meetingDetails.meetingTitleText).toHaveText(
      'My Meeting',
    );
    await expect(
      meetingDetails.meetingDetails.meetingDescriptionText,
    ).toHaveText('My Description');
    await meetingDetails.close();

    await expect(meetingDetails.meetingDetails.meetingDetailsView).toBeHidden();
  });

  test('should show meetings in work week view', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.switchView('work week');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10, 3]);
    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
    ).toBeVisible();

    const meetingDetails =
      await aliceMeetingsWidgetPage.openCalendarEventDetails('My Meeting');
    await expect(meetingDetails.meetingDetails.meetingTitleText).toHaveText(
      'My Meeting',
    );
    await expect(
      meetingDetails.meetingDetails.meetingDescriptionText,
    ).toHaveText('My Description');
    await meetingDetails.close();

    await expect(meetingDetails.meetingDetails.meetingDetailsView).toBeHidden();
  });

  test('should show meetings in month view', async ({
    aliceMeetingsWidgetPage,
  }) => {
    await aliceMeetingsWidgetPage.switchView('month');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10]);
    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
    ).toBeVisible();

    const meetingDetails =
      await aliceMeetingsWidgetPage.openCalendarEventDetails('My Meeting');
    await expect(meetingDetails.meetingDetails.meetingTitleText).toHaveText(
      'My Meeting',
    );
    await expect(
      meetingDetails.meetingDetails.meetingDescriptionText,
    ).toHaveText('My Description');
    await meetingDetails.close();

    await expect(meetingDetails.meetingDetails.meetingDetailsView).toBeHidden();
  });

  test('should switch to day week if window is resized', async ({
    aliceMeetingsWidgetPage,
    alicePage,
  }) => {
    await aliceMeetingsWidgetPage.switchView('month');
    await aliceMeetingsWidgetPage.setDateFilter([2040, 10]);

    await expect(
      aliceMeetingsWidgetPage.getCalendarEvent('My Meeting'),
    ).toBeVisible();

    await alicePage.setViewportSize({ width: 600, height: 720 });

    await aliceMeetingsWidgetPage.waitForCalendarView('day');
  });
});
