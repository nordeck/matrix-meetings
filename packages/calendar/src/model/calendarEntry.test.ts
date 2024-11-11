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

import { describe, expect, it } from 'vitest';
import {
  CalendarEntry,
  calendarEntrySchema,
  DateTimeEntry,
} from './calendarEntry';

describe('calendarEntrySchema', () => {
  it('should accept minimal entry', () => {
    expect(
      calendarEntrySchema.validate({
        uid: 'uuid',
        dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
      } as CalendarEntry).error,
    ).toBeUndefined();
  });

  it('should accept entry', () => {
    expect(
      calendarEntrySchema.validate({
        uid: 'uuid',
        dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        rrule: 'FREQ=DAILY',
        exdate: [{ tzid: 'Europe/Berlin', value: '20200101T000000' }],
        recurrenceId: { tzid: 'Europe/Berlin', value: '20200101T000000' },
      } as CalendarEntry).error,
    ).toBeUndefined();
  });

  it('should accept additional properties', () => {
    expect(
      calendarEntrySchema.validate({
        uid: 'uuid',
        dtstart: {
          tzid: 'Europe/Berlin',
          value: '20200101T000000',
          additional: 'tmp',
        },
        dtend: {
          tzid: 'Europe/Berlin',
          value: '20200101T000000',
          additional: 'tmp',
        },
        rrule: 'FREQ=DAILY',
        exdate: [
          {
            tzid: 'Europe/Berlin',
            value: '20200101T000000',
            additional: 'tmp',
          } as DateTimeEntry,
        ],
        recurrenceId: {
          tzid: 'Europe/Berlin',
          value: '20200101T000000',
          additional: 'tmp',
        },
        additional: 'tmp',
      } as CalendarEntry).error,
    ).toBeUndefined();
  });

  it.each<Object>([
    { uid: null },
    { uid: undefined },
    { uid: 111 },
    { dtstart: null },
    { dtstart: undefined },
    { dtstart: 111 },
    { dtstart: { tzid: 'T', value: null } },
    { dtstart: { tzid: 'T', value: undefined } },
    { dtstart: { tzid: 'T', value: 111 } },
    { dtstart: { tzid: 'T', value: 'invalid-date' } },
    { dtstart: { tzid: null, value: '20200101T000000' } },
    { dtstart: { tzid: undefined, value: '20200101T000000' } },
    { dtstart: { tzid: 111, value: '20200101T000000' } },
    { dtend: null },
    { dtend: undefined },
    { dtend: 111 },
    { dtend: { tzid: 'T', value: null } },
    { dtend: { tzid: 'T', value: undefined } },
    { dtend: { tzid: 'T', value: 111 } },
    { dtend: { tzid: 'T', value: 'invalid-date' } },
    { dtend: { tzid: null, value: '20200101T000000' } },
    { dtend: { tzid: undefined, value: '20200101T000000' } },
    { dtend: { tzid: 111, value: '20200101T000000' } },
    { rrule: null },
    { rrule: 111 },
    { exdate: null },
    { exdate: 111 },
    { exdate: [null] },
    { exdate: [undefined] },
    { exdate: [111] },
    { exdate: [{ tzid: 'T', value: null }] },
    { exdate: [{ tzid: 'T', value: undefined }] },
    { exdate: [{ tzid: 'T', value: 111 }] },
    { exdate: [{ tzid: 'T', value: 'invalid-date' }] },
    { exdate: [{ tzid: null, value: '20200101T000000' }] },
    { exdate: [{ tzid: undefined, value: '20200101T000000' }] },
    { exdate: [{ tzid: 111, value: '20200101T000000' }] },
    { recurrenceId: null },
    { recurrenceId: 111 },
    { recurrenceId: { tzid: 'T', value: null } },
    { recurrenceId: { tzid: 'T', value: undefined } },
    { recurrenceId: { tzid: 'T', value: 111 } },
    { recurrenceId: { tzid: 'T', value: 'invalid-date' } },
    { recurrenceId: { tzid: null, value: '20200101T000000' } },
    { recurrenceId: { tzid: undefined, value: '20200101T000000' } },
    { recurrenceId: { tzid: 111, value: '20200101T000000' } },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      calendarEntrySchema.validate({
        uid: 'uuid',
        dtstart: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        dtend: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        rrule: 'FREQ=DAILY',
        exdate: [{ tzid: 'Europe/Berlin', value: '20200101T000000' }],
        recurrenceId: { tzid: 'Europe/Berlin', value: '20200101T000000' },
        ...patch,
      } as CalendarEntry).error,
    ).not.toBeUndefined();
  });
});
