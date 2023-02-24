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

import { validate } from 'class-validator';
import { CalendarEntryDto, DateTimeEntryDto } from './CalendarEntryDto';

describe('DateTimeEntryDto', () => {
  it('should accept entry', async () => {
    const input = new DateTimeEntryDto('Europe/Berlin', '20200101T000000');

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it.each([
    { tzid: null },
    { tzid: undefined },
    { tzid: 111 },
    { value: null },
    { value: undefined },
    { value: 111 },
    { value: 'invalid-date' },
  ])('should reject entry with patch %p', async (patch) => {
    const input = new DateTimeEntryDto('Europe/Berlin', '20200101T000000');

    Object.entries(patch).forEach(([key, value]) => {
      (input as any)[key] = value;
    });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});

describe('CalendarEntryDto', () => {
  it('should accept minimal entry', async () => {
    const input = new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000')
    );

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should accept entry', async () => {
    const input = new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      'FREQ=DAILY',
      [new DateTimeEntryDto('Europe/Berlin', '20200101T000000')],
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000')
    );

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it.each([
    { uid: null },
    { uid: undefined },
    { uid: 111 },
    { dtstart: null },
    { dtstart: undefined },
    { dtstart: 111 },
    { dtend: null },
    { dtend: undefined },
    { dtend: 111 },
    { rrule: 111 },
    { exdate: 111 },
    { exdate: [null] },
    { exdate: [undefined] },
    { exdate: [111] },
    { recurrenceId: 111 },
  ])('should reject entry with patch %p', async (patch) => {
    const input = new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      'FREQ=DAILY',
      [new DateTimeEntryDto('Europe/Berlin', '20200101T000000')],
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000')
    );

    Object.entries(patch).forEach(([key, value]) => {
      (input as any)[key] = value;
    });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
