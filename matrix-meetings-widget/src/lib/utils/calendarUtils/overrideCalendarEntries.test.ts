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
import { overrideCalendarEntries } from './overrideCalendarEntries';

describe('overrideCalendarEntries', () => {
  const rruleEntry = mockCalendarEntry({
    dtstart: '20200109T100000',
    dtend: '20200109T110000',
    rrule: 'FREQ=DAILY;COUNT=5',
  });

  it('should add new override entry', () => {
    expect(
      overrideCalendarEntries(
        '2020-01-10T10:00:00Z',
        '2020-01-11T10:00:00Z',
        '2020-01-11T11:00:00Z',
        [rruleEntry],
      ),
    ).toEqual([
      {
        dtend: {
          tzid: 'UTC',
          value: '20200109T110000',
        },
        dtstart: {
          tzid: 'UTC',
          value: '20200109T100000',
        },
        rrule: 'FREQ=DAILY;COUNT=5',
        uid: 'entry-0',
      },
      {
        dtend: {
          tzid: 'UTC',
          value: '20200111T110000',
        },
        dtstart: {
          tzid: 'UTC',
          value: '20200111T100000',
        },
        recurrenceId: {
          tzid: 'UTC',
          value: '20200110T100000',
        },
        uid: 'entry-0',
      },
    ]);
  });

  it('should update override entry', () => {
    const updateEntry = {
      uid: 'entry-0',
      recurrenceId: {
        tzid: 'UTC',
        value: '20200110T100000',
      },
      dtend: {
        tzid: 'UTC',
        value: '20200111T110000',
      },
      dtstart: {
        tzid: 'UTC',
        value: '20200111T100000',
      },
    };

    expect(
      overrideCalendarEntries(
        '2020-01-10T10:00:00Z',
        '2020-01-11T14:00:00Z',
        '2020-01-11T15:00:00Z',
        [rruleEntry, updateEntry],
      ),
    ).toEqual([
      {
        dtend: {
          tzid: 'UTC',
          value: '20200109T110000',
        },
        dtstart: {
          tzid: 'UTC',
          value: '20200109T100000',
        },

        rrule: 'FREQ=DAILY;COUNT=5',
        uid: 'entry-0',
      },
      {
        dtend: {
          tzid: 'UTC',
          value: '20200111T150000',
        },
        dtstart: {
          tzid: 'UTC',
          value: '20200111T140000',
        },
        recurrenceId: {
          tzid: 'UTC',
          value: '20200110T100000',
        },
        uid: 'entry-0',
      },
    ]);
  });
});
