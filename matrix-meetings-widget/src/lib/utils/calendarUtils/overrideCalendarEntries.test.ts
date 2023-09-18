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

import { mockCalendarEntry } from '../../../lib/testUtils';
import { overrideCalendarEntries } from './overrideCalendarEntries';

describe('overrideCalendarEntries', () => {
  it('should update existing single entry', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
      }),

      // another entry that should stay
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
    ];

    expect(
      overrideCalendarEntries(
        calendar,
        mockCalendarEntry({
          dtstart: '20200111T100000',
          dtend: '20200111T110000',
        }),
      ),
    ).toEqual([
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T100000',
        dtend: '20200111T110000',
      }),
    ]);
  });

  it('should update existing single recurring entry', () => {
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
      }),
    ];

    expect(
      overrideCalendarEntries(
        calendar,
        mockCalendarEntry({
          dtstart: '20200111T100000',
          dtend: '20200111T110000',
          rrule: 'FREQ=DAILY',
        }),
      ),
    ).toEqual([
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T100000',
        dtend: '20200111T110000',
        rrule: 'FREQ=DAILY',
      }),
    ]);
  });

  it('should update single recurring entry with existing overrides', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
        exdate: ['20200110T100000'],
      }),
      mockCalendarEntry({
        dtstart: '20200111T120000',
        dtend: '20200111T130000',
        recurrenceId: '20200111T100000',
      }),

      // another entry that should stay
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
    ];

    expect(
      overrideCalendarEntries(
        calendar,
        mockCalendarEntry({
          dtstart: '20200111T100000',
          dtend: '20200111T110000',
          rrule: 'FREQ=DAILY',
        }),
      ),
    ).toEqual([
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T100000',
        dtend: '20200111T110000',
        rrule: 'FREQ=DAILY',
      }),
    ]);
  });

  it('should add an updated occurrence to a single recurring meeting', () => {
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
      }),
    ];

    expect(
      overrideCalendarEntries(
        calendar,
        mockCalendarEntry({
          dtstart: '20200111T120000',
          dtend: '20200111T130000',
          recurrenceId: '20200111T100000',
        }),
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T120000',
        dtend: '20200111T130000',
        recurrenceId: '20200111T100000',
      }),
    ]);
  });

  it('should update a single occurrence of a recurring meeting', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
      mockCalendarEntry({
        dtstart: '20200111T103000',
        dtend: '20200111T113000',
        recurrenceId: '20200111T100000',
      }),

      // another override that should stay
      mockCalendarEntry({
        dtstart: '20200115T103000',
        dtend: '20200115T113000',
        recurrenceId: '20200115T100000',
      }),

      // another entry that should stay
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
    ];

    expect(
      overrideCalendarEntries(
        calendar,
        mockCalendarEntry({
          dtstart: '20200111T120000',
          dtend: '20200111T130000',
          recurrenceId: '20200111T100000',
        }),
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
      mockCalendarEntry({
        dtstart: '20200115T103000',
        dtend: '20200115T113000',
        recurrenceId: '20200115T100000',
      }),
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T120000',
        dtend: '20200111T130000',
        recurrenceId: '20200111T100000',
      }),
    ]);
  });
});
