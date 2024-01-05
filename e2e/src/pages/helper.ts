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

import { FrameLocator, Locator } from '@playwright/test';

export async function fillDatePicker(
  frame: FrameLocator,
  datePickerButton: Locator,
  startDate: [number, number] | [number, number, number],
  endDate?: [number, number] | [number, number, number],
) {
  await datePickerButton.click();

  const pickerModal = frame.getByRole('dialog');
  await fillDate(pickerModal, startDate);
  if (endDate) {
    await fillDate(pickerModal, endDate);
  }

  await pickerModal.waitFor({ state: 'hidden' });
}

export async function fillTimePicker(
  frame: FrameLocator,
  timePickerButton: Locator,
  time: string,
) {
  await timePickerButton.click();

  const timeModal = frame.getByRole('dialog');
  await fillTime(timeModal, time);
}

export async function fillDate(
  pickerModal: Locator,
  date: [number, number] | [number, number, number],
) {
  const [year, month, day] = date;
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, (month - 1) % 12)));

  await pickerModal
    .getByRole('button', { name: /switch to year view/ })
    .click();
  await pickerModal.getByRole('radio', { name: `${year}` }).click();
  await pickerModal.getByRole('radio', { name: `${monthLabel}` }).click();

  if (day !== undefined) {
    // There might be a transition between two month views, therefore we wait
    // till only one is left.
    await pickerModal
      .locator(':nth-match(.MuiDayPicker-monthContainer, 2)')
      .waitFor({ state: 'hidden' });

    // The day view might show the same date from a previous month, filter them
    // out
    await pickerModal
      .locator(`button:not(.MuiPickersDay-dayOutsideMonth) >> text="${day}"`)
      .click();
  }
}

export async function fillTime(pickerModal: Locator, time: string) {
  const [hours, minutes, ampm] = time.split(/:|\s/);
  const mins = minutes === '00' ? '0' : minutes;

  await pickerModal.getByRole('option', { name: `${hours} hours` }).click();
  await pickerModal
    .getByRole('option', { name: `${mins} minutes`, exact: true })
    .click();
  await pickerModal.getByRole('option', { name: `${ampm}` }).click();
}
