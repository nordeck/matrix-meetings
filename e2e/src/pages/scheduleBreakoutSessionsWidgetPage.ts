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

export class ScheduleBreakoutSessionsWidgetPage {
  public readonly createMeetingButton: Locator;
  public readonly descriptionTextbox: Locator;
  public readonly startTimeTextbox: Locator;
  public readonly endTimeTextbox: Locator;
  public readonly groupNumberSnipButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
  ) {
    const dialog = this.page.getByRole('dialog', {
      name: 'Schedule Breakout Session',
    });
    this.createMeetingButton = dialog.getByRole('button', {
      name: 'Create Breakout Session',
    });
    this.descriptionTextbox = widget.getByRole('textbox', {
      name: 'Description',
    });
    this.startTimeTextbox = widget.getByRole('textbox', { name: 'Start time' });
    this.endTimeTextbox = widget.getByRole('textbox', { name: 'End time' });
    this.groupNumberSnipButton = widget.getByRole('spinbutton', {
      name: 'Number of groups (required)',
    });
  }

  async waitForAvailableWidgets() {
    await this.widget.getByRole('combobox', { name: 'Widgets' }).waitFor();
    await this.widget.getByRole('progressbar').waitFor({ state: 'hidden' });
  }

  async setStartAndEndTime(startTime: string, endTime: string) {
    await this.startTimeTextbox.fill(startTime);
    await this.endTimeTextbox.fill(endTime);
  }

  async addParticipantToGroup(name: string, group: string) {
    const participantCombobox = this.widget
      .getByRole('list', { name: 'Groups' })
      .locator(`role=listItem[name="${group}"]`)
      .getByRole('combobox', { name: 'Select participants' });
    await participantCombobox.type(name);
    await participantCombobox.press('ArrowDown');
    await participantCombobox.press('Enter');
  }

  getGroupTitleTextbox(group: string) {
    return this.widget
      .getByRole('list', { name: 'Groups' })
      .locator(`role=listItem[name="${group}"]`)
      .getByRole('textbox', { name: 'Group title (required)' });
  }

  async createBreakoutSessions() {
    await this.createMeetingButton.click();
  }
}
