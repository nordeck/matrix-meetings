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
import { ScheduleMeetingWidgetPage } from './scheduleMeetingWidgetPage';

export class MeetingCardPage {
  public readonly meetingTimeRangeText: Locator;
  public readonly meetingTitleText: Locator;
  public readonly meetingDescriptionText: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
    public readonly card: Locator,
  ) {
    this.meetingTimeRangeText = this.card
      .getByRole('heading')
      .locator('..')
      .locator('> span');
    this.meetingTitleText = this.card.getByRole('heading', { level: 3 });
    this.meetingDescriptionText = this.card.getByRole('paragraph').first();
  }

  async openMoreSettingsMenu(): Promise<MoreSettingsMenuPage> {
    await this.card.getByRole('button', { name: 'More settings' }).click();

    return new MoreSettingsMenuPage(this.widget.getByRole('menu'));
  }

  async deleteMeeting(buttonLabel: string = 'Delete') {
    const menu = await this.openMoreSettingsMenu();
    await menu.deleteMenuItem.click();
    await this.widget
      .getByRole('dialog', { name: 'Delete meeting' })
      .getByRole('button', { name: buttonLabel })
      .click();

    await this.widget
      .getByRole('dialog', { name: 'Delete meeting' })
      .waitFor({ state: 'hidden' });
  }

  async editMeeting(): Promise<ScheduleMeetingWidgetPage> {
    const menu = await this.openMoreSettingsMenu();
    await menu.editMenuItem.click();

    // We spawned a new widget and have to approve the capabilities:
    const elementWebPage = new ElementWebPage(this.page);
    const editMeetingWidgetPage = new ScheduleMeetingWidgetPage(
      this.page,
      elementWebPage.widgetByTitle('Edit Meeting'),
    );

    await elementWebPage.approveWidgetCapabilities();

    await editMeetingWidgetPage.titleTextbox.waitFor({ state: 'attached' });

    await elementWebPage.approveWidgetIdentity();

    await editMeetingWidgetPage.waitForAvailableWidgets();

    return editMeetingWidgetPage;
  }

  async switchToEditPermissions() {
    await this.card.getByRole('button', { name: 'Edit permissions' }).click();
  }

  async switchToShareMeeting() {
    await this.card.getByRole('button', { name: 'Share meeting' }).click();
  }

  async getShareLink(): Promise<string> {
    await this.card.getByRole('button', { name: 'Share meeting link' }).click();

    const shareLinkDialog = this.widget.getByRole('dialog', {
      name: 'Share the link to the meeting room',
    });

    const shareLink = await shareLinkDialog
      .getByRole('textbox', { name: 'Meeting link' })
      .inputValue();

    await shareLinkDialog.getByRole('button', { name: 'Close' }).click();

    return shareLink;
  }

  async joinMeeting() {
    await this.card
      .getByRole('button', { name: 'Open the meeting room' })
      .first()
      .click();
  }
}

export class MoreSettingsMenuPage {
  public readonly editMenuItem: Locator;
  public readonly deleteMenuItem: Locator;
  public readonly editInOpenXchangeMenuItem: Locator;
  public readonly deleteInOpenXchangeMenuItem: Locator;

  constructor(menu: Locator) {
    this.editMenuItem = menu.getByRole('menuitem', {
      name: 'Edit meeting',
    });
    this.deleteMenuItem = menu.getByRole('menuitem', {
      name: 'Delete meeting',
    });
    this.editInOpenXchangeMenuItem = menu.getByRole('menuitem', {
      name: 'Edit meeting in Open-Xchange',
    });
    this.deleteInOpenXchangeMenuItem = menu.getByRole('menuitem', {
      name: 'Delete meeting in Open-Xchange',
    });
  }
}
