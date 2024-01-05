/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { ScheduleMeetingWidgetPage } from './scheduleMeetingWidgetPage';

export class MeetingDetailsPage {
  public readonly meetingTitleText: Locator;
  public readonly meetingDescriptionText: Locator;
  public readonly meetingTimeRangeText: Locator;
  public readonly meetingRecurrenceRuleText: Locator;
  public readonly editMenuItem: Locator;
  public readonly deleteMenuItem: Locator;
  public readonly editInOpenXchangeMenuItem: Locator;
  public readonly deleteInOpenXchangeMenuItem: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
    public readonly meetingDetailsView: Locator,
  ) {
    this.meetingTitleText = this.meetingDetailsView.getByRole('heading', {
      level: 3,
    });
    this.meetingDescriptionText = this.meetingDetailsView
      .getByRole('paragraph')
      .first();

    this.meetingTimeRangeText = this.meetingDetailsView.getByTestId('date');
    this.meetingRecurrenceRuleText =
      this.meetingDetailsView.getByTestId('recurrenceRole');
    this.editMenuItem = meetingDetailsView.getByRole('button', {
      name: 'Edit',
    });
    this.deleteMenuItem = meetingDetailsView.getByRole('button', {
      name: 'Delete',
    });
    this.editInOpenXchangeMenuItem = meetingDetailsView.getByRole('link', {
      name: 'Edit meeting in Open-Xchange',
    });
    this.deleteInOpenXchangeMenuItem = meetingDetailsView.getByRole('link', {
      name: 'Delete meeting in Open-Xchange',
    });
  }

  async deleteMeeting() {
    await this.meetingDetailsView
      .getByRole('button', { name: 'Delete' })
      .click();

    await this.widget
      .getByRole('dialog', { name: 'Delete meeting' })
      .getByRole('button', { name: 'Delete' })
      .click();
  }

  async editMeeting(): Promise<ScheduleMeetingWidgetPage> {
    await this.widget.getByRole('button', { name: 'Edit' }).click();

    // We spawned a new widget and have to approve the capabilities:
    const elementWebPage = new ElementWebPage(this.page);
    const editMeetingWidgetPage = new ScheduleMeetingWidgetPage(
      this.page,
      elementWebPage.widgetByTitle('Edit Meeting'),
    );

    await elementWebPage.approveWidgetCapabilities();

    await editMeetingWidgetPage.titleTextbox.waitFor({
      state: 'attached',
      timeout: 30000,
    });

    await elementWebPage.approveWidgetIdentity();

    await editMeetingWidgetPage.waitForAvailableWidgets();

    return editMeetingWidgetPage;
  }
}
