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

import { normalizeCalendarEntry } from './normalizeCalendarEntry';

describe('normalizeCalendarEntry', () => {
  it('should keep dtstart and dtend if it is matches the first occurence of the rrule', () => {
    expect(
      normalizeCalendarEntry({
        uid: 'entry-0',
        dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
        dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
        rrule: 'FREQ=WEEKLY;COUNT=30;INTERVAL=1;BYDAY=FR',
      })
    ).toEqual({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      rrule: 'FREQ=WEEKLY;COUNT=30;INTERVAL=1;BYDAY=FR',
    });
  });

  it('should keep dtstart and dtend if entry does not contain an rrule', () => {
    expect(
      normalizeCalendarEntry({
        uid: 'entry-0',
        dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
        dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
      })
    ).toEqual({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
    });
  });

  it('should set dtstart and dtend to the first occurence of the rrule', () => {
    expect(
      normalizeCalendarEntry({
        uid: 'entry-0',
        dtstart: { tzid: 'Europe/Berlin', value: '20210101T100000' },
        dtend: { tzid: 'Europe/Berlin', value: '20210101T140000' },
        rrule: 'FREQ=WEEKLY;COUNT=30;INTERVAL=1;BYDAY=SA',
      })
    ).toEqual({
      uid: 'entry-0',
      dtstart: { tzid: 'Europe/Berlin', value: '20210102T100000' },
      dtend: { tzid: 'Europe/Berlin', value: '20210102T140000' },
      rrule: 'FREQ=WEEKLY;COUNT=30;INTERVAL=1;BYDAY=SA',
    });
  });
});
