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

import { mockCalendarEntry } from '../../testUtils';
import { deleteCalendarEvent } from './deleteCalendarEvent';

describe('deleteCalendarEvent', () => {
  it('should handle empty array', () => {
    expect(deleteCalendarEvent([], 'entry-0', '2020-01-01T00:00:00Z')).toEqual(
      [],
    );
  });

  it('should delete an occurrence of a meeting', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),

      // another entry that should stay
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
        rrule: 'FREQ=DAILY',
      }),
    ];

    expect(
      deleteCalendarEvent(calendar, 'entry-0', '2020-02-15T10:00:00Z'),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
        exdate: ['20200215T100000'],
      }),
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
        rrule: 'FREQ=DAILY',
      }),
    ]);
  });

  it('should delete an occurrence of a meeting with an existing exdate', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
        exdate: ['20200110T100000'],
      }),

      // another entry that should stay
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
        rrule: 'FREQ=DAILY',
      }),
    ];

    expect(
      deleteCalendarEvent(calendar, 'entry-0', '2020-02-15T10:00:00Z'),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
        exdate: ['20200110T100000', '20200215T100000'],
      }),
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
        rrule: 'FREQ=DAILY',
      }),
    ]);
  });

  it('should delete existing overrides', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
      mockCalendarEntry({
        dtstart: '20200110T103000',
        dtend: '20200110T113000',
        recurrenceId: '20200110T100000',
      }),

      // another override that should stay
      mockCalendarEntry({
        dtstart: '20200115T103000',
        dtend: '20200115T113000',
        recurrenceId: '20200115T100000',
      }),
    ];

    expect(
      deleteCalendarEvent(calendar, 'entry-0', '2020-01-10T10:00:00Z'),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
        exdate: ['20200110T100000'],
      }),
      mockCalendarEntry({
        dtstart: '20200115T103000',
        dtend: '20200115T113000',
        recurrenceId: '20200115T100000',
      }),
    ]);
  });

  it('should skip an occurrence of a meeting that does not match the series', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
    ];

    expect(
      deleteCalendarEvent(calendar, 'entry-0', '2020-02-15T23:59:59Z'),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
    ]);
  });
});
