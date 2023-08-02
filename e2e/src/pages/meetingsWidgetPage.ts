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

import { FrameLocator, Locator, Page } from '@playwright/test';
import { ElementWebPage } from './elementWebPage';
import { fillDatePicker } from './helper';
import { MeetingCardPage } from './meetingCardPage';
import { MeetingDetailsPage } from './meetingDetailsPage';
import { ScheduleMeetingWidgetPage } from './scheduleMeetingWidgetPage';

export type CalendarView = 'list' | 'day' | 'week' | 'work week' | 'month';

export class MeetingsWidgetPage {
  public readonly scheduleMeetingButton: Locator;
  public readonly meetingsList: Locator;
  public readonly meetingsEmptyListItem: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator
  ) {
    this.scheduleMeetingButton = widget.getByRole('button', {
      name: 'Schedule Meeting',
    });
    this.meetingsList = widget.getByRole('list', { name: 'Meetings' });
    this.meetingsEmptyListItem = this.meetingsList.getByRole('listitem', {
      name: 'No meetings scheduled that match the selected filters.',
    });
  }

  async switchView(view: CalendarView) {
    await this.widget.getByRole('button', { name: /^View/ }).click();
    await this.widget
      .getByRole('option', { name: new RegExp(`^${view}$`, 'i') })
      .click();
  }

  async waitForCalendarView(view: CalendarView) {
    await this.widget
      .getByRole('button', { name: new RegExp(`^View ${view}$`, 'i') })
      .isVisible();
  }

  async scheduleMeeting(): Promise<ScheduleMeetingWidgetPage> {
    await this.scheduleMeetingButton.click();

    // We spawned a new widget and have to approve the capabilities:
    const elementWebPage = new ElementWebPage(this.page);
    const scheduleMeetingWidgetPage = new ScheduleMeetingWidgetPage(
      this.page,
      elementWebPage.widgetByTitle('Schedule Meeting')
    );

    await elementWebPage.approveWidgetCapabilities();

    await scheduleMeetingWidgetPage.titleTextbox.waitFor({ state: 'attached' });

    await elementWebPage.approveWidgetIdentity();

    await scheduleMeetingWidgetPage.waitForAvailableWidgets();

    return scheduleMeetingWidgetPage;
  }

  async setDateFilter(
    fromDate: [number, number] | [number, number, number],
    toDate?: [number, number, number]
  ) {
    await fillDatePicker(
      this.widget,
      this.widget.getByRole('button', {
        name: /Choose (date range|date|work week|week|month), selected/,
      }),
      fromDate,
      toDate
    );
  }

  getMeeting(title: string, date?: string): MeetingCardPage {
    const target = date
      ? this.meetingsList.getByRole('list', { name: new RegExp(date) })
      : this.meetingsList;
    return new MeetingCardPage(
      this.page,
      this.widget,
      target.getByRole('listitem', { name: title })
    );
  }

  getCalendarEvent(title: string): Locator {
    return this.widget.getByRole('button', { name: new RegExp(`“${title}”`) });
  }

  async openCalendarEventDetails(
    title: string
  ): Promise<CalendarEventDetailsPage> {
    const elementWebPage = new ElementWebPage(this.page);
    await this.getCalendarEvent(title).click();

    await elementWebPage.approveWidgetIdentity();

    return new CalendarEventDetailsPage(
      this.page,
      this.widget,
      this.widget.getByRole('dialog', { name: title })
    );
  }
}

class CalendarEventDetailsPage {
  public readonly meetingDetails: MeetingDetailsPage;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
    private readonly dialog: Locator
  ) {
    this.meetingDetails = new MeetingDetailsPage(
      this.page,
      this.widget,
      this.widget.getByRole('region', { name: 'Meeting details' })
    );
  }

  async close() {
    await this.dialog.getByRole('button', { name: 'Close' }).click();
  }
}
