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

import { DateTime } from 'luxon';
import { getCalendarEnd } from './getCalendarEnd';

describe('getCalendarEnd', () => {
  it('should handle calendar with a single event', () => {
    expect(
      getCalendarEnd([
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
          rrule: undefined,
          exdate: undefined,
          recurrenceId: undefined,
        },
      ]),
    ).toEqual(DateTime.fromISO('2020-01-09T11:00:00Z'));
  });

  it('should handle calendar with a single recurring event that never ends', () => {
    expect(
      getCalendarEnd([
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
        },
        {
          uid: 'entry-1',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
          rrule: 'FREQ=DAILY',
        },
      ]),
    ).toEqual(undefined);
  });

  it('should handle calendar with a single recurring event that ends', () => {
    expect(
      getCalendarEnd([
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
      ]),
    ).toEqual(DateTime.fromISO('2020-01-11T11:00:00Z'));
  });

  it('should handle calendar with a single recurring event that ends with an updated occurrence', () => {
    expect(
      getCalendarEnd([
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200131T150000' },
          dtend: { tzid: 'UTC', value: '20200131T163000' },
          rrule: undefined,
          exdate: undefined,
          recurrenceId: { tzid: 'UTC', value: '20200111T100000' },
        },
      ]),
    ).toEqual(DateTime.fromISO('2020-01-31T16:30:00Z'));
  });

  it('should skip recurring event updates if the recurrence-id does not match the recurring rule', () => {
    expect(
      getCalendarEnd([
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20200131T150000' },
          dtend: { tzid: 'UTC', value: '20200131T163000' },
          rrule: undefined,
          exdate: undefined,
          recurrenceId: { tzid: 'UTC', value: '20200128T100000' },
        },
      ]),
    ).toEqual(DateTime.fromISO('2020-01-11T11:00:00Z'));
  });
});
