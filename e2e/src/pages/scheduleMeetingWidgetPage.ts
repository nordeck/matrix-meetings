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
import { fillDatePicker, fillTimePicker } from './helper';

export class ScheduleMeetingWidgetPage {
  public readonly submitMeetingButton: Locator;
  public readonly titleTextbox: Locator;
  public readonly descriptionTextbox: Locator;
  public readonly startDateTextbox: Locator;
  public readonly startTimeTextbox: Locator;
  public readonly participantsCombobox: Locator;
  public readonly allowMessagingCheckbox: Locator;
  public readonly widgetsCombobox: Locator;
  public readonly afterMeetingCountRadio: Locator;
  public readonly afterMeetingCountSpinbutton: Locator;
  public readonly customRecurrenceRuleGroup: Locator;
  public readonly switchRecurringEdit: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
  ) {
    const dialog = this.page.getByRole('dialog', {
      name: /Schedule Meeting|Edit Meeting/,
    });
    this.switchRecurringEdit = widget.getByRole('checkbox', {
      name: 'Edit the recurring meeting series',
    });
    this.submitMeetingButton = dialog.getByRole('button', {
      name: /Create Meeting|Save/,
    });

    this.titleTextbox = widget.getByRole('textbox', { name: /Title/ });
    this.descriptionTextbox = widget.getByRole('textbox', {
      name: /Description/,
    });
    this.startDateTextbox = widget.getByRole('textbox', { name: 'Start date' });
    this.startTimeTextbox = widget.getByRole('textbox', { name: 'Start time' });
    this.participantsCombobox = widget.getByRole('combobox', {
      name: 'Participants',
    });
    this.allowMessagingCheckbox = widget.getByRole('checkbox', {
      name: 'Allow messaging for all participants',
    });
    this.widgetsCombobox = this.widget.getByRole('combobox', {
      name: 'Widgets',
    });
    this.afterMeetingCountRadio = this.widget.getByRole('radio', {
      name: /Ends after/,
    });
    this.afterMeetingCountSpinbutton = this.widget.getByRole('spinbutton', {
      name: 'Count of meetings',
    });
    this.customRecurrenceRuleGroup = this.widget.getByRole('group', {
      name: 'Custom recurring meeting',
    });
  }

  async waitForAvailableWidgets() {
    await this.widgetsCombobox.waitFor();

    await this.widget.getByRole('progressbar').waitFor({ state: 'hidden' });
  }

  async setStart(date: [number, number, number], time: string) {
    await fillDatePicker(
      this.widget,
      this.widget.getByRole('button', { name: /Choose start date/ }),
      date,
    );

    await fillTimePicker(
      this.widget,
      this.widget.getByRole('button', { name: 'Choose start time' }),
      time,
    );
  }

  async toggleRecurringEdit() {
    await this.switchRecurringEdit.click();
  }

  async toggleChatPermission() {
    await this.allowMessagingCheckbox.click();
  }

  async addParticipant(name: string) {
    // First click into the combobox. Otherwise the autocomplete does not work.
    await this.participantsCombobox.click();
    await this.participantsCombobox.fill(name);
    await this.widget.getByRole('option', { name }).waitFor();
    await this.participantsCombobox.press('ArrowDown');
    await this.participantsCombobox.press('Enter');
  }

  async addWidget(widgetName: string) {
    await this.widgetsCombobox.click();
    await this.widget.getByRole('option', { name: widgetName }).click();
    await this.widget.getByRole('button', { name: widgetName }).waitFor();
  }

  async removeLastWidget() {
    await this.widget
      .getByRole('button', { name: 'Video Conference' })
      .waitFor();
    await this.widgetsCombobox.press('Backspace');
    await this.widget
      .getByRole('button', { name: 'Video Conference' })
      .waitFor({ state: 'hidden' });
  }

  async selectRecurrence(
    name: 'no repetition' | 'daily' | 'weekly' | 'montly' | 'yearly' | 'custom',
  ) {
    await this.widget
      .getByRole('combobox', { name: /^Repeat meeting/ })
      .click();
    await this.widget
      .getByRole('listbox', { name: 'Repeat meeting' })
      .getByRole('option', { name })
      .click();
  }

  async selectRecurrenceFrequency(name: 'days' | 'weeks' | 'months' | 'years') {
    await this.customRecurrenceRuleGroup
      .getByRole('combobox', { name: /^Repeat/ })
      .click();
    await this.widget
      .getByRole('listbox', { name: 'Repeat' })
      .getByRole('option', { name })
      .click();
  }

  getRecurrenceWeekdayButton(
    name:
      | 'Monday'
      | 'Tuesday'
      | 'Wednesday'
      | 'Thursday'
      | 'Friday'
      | 'Saturday',
  ): Locator {
    const repeatOnWeekdayGroup = this.customRecurrenceRuleGroup.getByRole(
      'group',
      { name: 'Repeat on weekday' },
    );
    return repeatOnWeekdayGroup.getByRole('button', { name });
  }

  async setEndAfterMeetingCount(count: number) {
    await this.afterMeetingCountRadio.click();
    await this.afterMeetingCountSpinbutton.fill(`${count}`);
  }

  async submit() {
    await this.submitMeetingButton.click();
  }
}
