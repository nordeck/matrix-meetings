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

import { mockCalendar, mockCalendarEntry } from '../../testUtils';
import { isRecurringMeeting } from './isRecurringMeeting';

describe('isRecurringMeeting', () => {
  it('should detect a single calendar entry as non recurring event', () => {
    expect(
      isRecurringMeeting(
        mockCalendar({
          dtstart: '20210101T100000',
          dtend: '20210101T140000',
        })
      )
    ).toBe(false);
  });

  it('should detect a single calendar entry with a recurrence rule as a recurring event', () => {
    expect(
      isRecurringMeeting(
        mockCalendar({
          dtstart: '20210101T100000',
          dtend: '20210101T140000',
          rrule: 'FREQ=DAILY',
        })
      )
    ).toBe(true);
  });

  it('should detect multiple calendar entries as an recurring event', () => {
    expect(
      isRecurringMeeting([
        mockCalendarEntry({
          dtstart: '20210101T100000',
          dtend: '20210101T140000',
        }),
        mockCalendarEntry({
          uid: 'entry-1',
          dtstart: '20210101T100000',
          dtend: '20210101T140000',
        }),
      ])
    ).toBe(true);
  });
});
