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
import { ScheduleBreakoutSessionsWidgetPage } from './index';
import { MeetingCardPage } from './meetingCardPage';

export class BreakoutSessionsPage {
  public readonly scheduleBreakoutSessionsButton: Locator;
  public readonly breakoutMeetingsList: Locator;
  public readonly sendMessageToBreakoutSessionsTextbox: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
  ) {
    this.scheduleBreakoutSessionsButton = widget.getByRole('button', {
      name: 'Schedule Breakout Session',
    });
    this.breakoutMeetingsList = widget.getByRole('list', { name: 'Meetings' });
    this.sendMessageToBreakoutSessionsTextbox = widget.getByRole('textbox', {
      name: 'Send message to all breakout session rooms',
    });
  }

  async scheduleBreakoutSession(): Promise<ScheduleBreakoutSessionsWidgetPage> {
    await this.scheduleBreakoutSessionsButton.click();

    // We spawned a new widget and have to approve the capabilities:
    const elementWebPage = new ElementWebPage(this.page);
    const scheduleBreakoutSessionWidgetPage =
      new ScheduleBreakoutSessionsWidgetPage(
        this.page,
        elementWebPage.widgetByTitle('Schedule Breakout Session'),
      );

    await elementWebPage.approveWidgetCapabilities();

    await elementWebPage.approveWidgetIdentity();

    await scheduleBreakoutSessionWidgetPage.waitForAvailableWidgets();

    return scheduleBreakoutSessionWidgetPage;
  }

  async setDateFilter(
    fromDate: [number, number, number],
    toDate?: [number, number, number],
  ) {
    await fillDatePicker(
      this.widget,
      this.widget.getByRole('button', {
        name: /Choose (date range|date|work week|week|month), selected/,
      }),
      fromDate,
      toDate,
    );
  }

  async sendMessageToAllBreakoutSession(message: string) {
    await this.sendMessageToBreakoutSessionsTextbox.fill(message);
    await this.sendMessageToBreakoutSessionsTextbox.press('Enter');
  }

  getBreakoutSession(title: string, date?: string): MeetingCardPage {
    const target = date
      ? this.breakoutMeetingsList.getByRole('list', { name: date })
      : this.breakoutMeetingsList;
    return new MeetingCardPage(
      this.page,
      this.widget,
      target.getByRole('listitem', { name: title }),
    );
  }
}
