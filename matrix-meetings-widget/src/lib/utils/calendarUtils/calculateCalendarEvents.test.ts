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
import { calculateCalendarEvents } from './calculateCalendarEvents';

describe('calculateCalendarEvents', () => {
  it('should handle calendar with a single event', () => {
    const calendar = mockCalendar({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
    });

    expect(
      calculateCalendarEvents({
        calendar,
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2021-01-31T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: calendar,
      },
    ]);
  });

  it('should handle calendar with a single recurring event', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
    ]);
  });

  it('should handle calendar with a single recurring event where the start date is not part of the series', () => {
    const rruleEntry = mockCalendarEntry({
      // a thursday, that is not included in the rrule
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY;BYDAY=MO,TU,WE,FR,SA,SU',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
    ]);
  });

  it('should handle calendar with a recurring event with a deleted occurrence', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
      exdate: ['20200111T100000'],
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
    ]);
  });

  it('should handle calendar with a recurring event with an updated occurrence', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200110T150000',
      dtend: '20200110T163000',
      recurrenceId: '20200110T100000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T15:00:00Z',
        endTime: '2020-01-10T16:30:00Z',
        entries: [rruleEntry, overrideEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
    ]);
  });

  it('should skip recurring event updates if the recurrence-id does not match the recurring rule', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200110T150000',
      dtend: '20200110T163000',
      recurrenceId: '20200110T200000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
    ]);
  });

  it('should handle calendar with a recurring event with a split recurring series', () => {
    const rruleEntry0 = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY;UNTIL=20200110T235959Z',
    });
    const rruleEntry1 = mockCalendarEntry({
      uid: 'entry-1',
      dtstart: '20200111T110000',
      dtend: '20200111T123000',
      rrule: 'FREQ=WEEKLY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry0, rruleEntry1],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-18T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry0],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry0],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-1',
        startTime: '2020-01-11T11:00:00Z',
        endTime: '2020-01-11T12:30:00Z',
        entries: [rruleEntry1],
        recurrenceId: '2020-01-11T11:00:00Z',
      },
      {
        uid: 'entry-1',
        startTime: '2020-01-18T11:00:00Z',
        endTime: '2020-01-18T12:30:00Z',
        entries: [rruleEntry1],
        recurrenceId: '2020-01-18T11:00:00Z',
      },
    ]);
  });

  it('should skip occurrences prior to the fromDate (inclusive test)', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY;UNTIL=20200109T235959',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-08T10:59:59Z',
        toDate: '2020-01-31T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-08T10:00:00Z',
        endTime: '2020-01-08T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-08T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
    ]);
  });

  it('should skip occurrences prior to the fromDate (exclusive test)', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY;UNTIL=20200109T235959',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-08T11:00:00Z',
        toDate: '2020-01-31T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
    ]);
  });

  it('should skip occurrences later than the toDate', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200111T150000',
      dtend: '20200111T163000',
      recurrenceId: '20200111T100000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-10T10:00:00Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
    ]);
  });

  it('should skip occurrences later than the toDate and exceed the limit (endTime first)', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-10T10:00:00Z',
        limit: 3,
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
    ]);
  });

  it('should skip occurrences later than the toDate and exceed the limit (limit first)', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-10T10:00:00Z',
        limit: 1,
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
    ]);
  });

  it('should skip occurrences that exceed the limit', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry],
        fromDate: '2020-01-01T00:00:00Z',
        limit: 2,
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
    ]);
  });

  it('should sort entries', () => {
    const entry0 = mockCalendarEntry({
      dtstart: '20200110T150000',
      dtend: '20200110T163000',
      rrule: 'FREQ=DAILY;COUNT=2',
    });
    const entry1 = mockCalendarEntry({
      uid: 'entry-1',
      dtstart: '20200109T100000',
      dtend: '20200109T110000',
      rrule: 'FREQ=DAILY;COUNT=2',
    });
    const entry1Override = mockCalendarEntry({
      uid: 'entry-1',
      dtstart: '20200108T150000',
      dtend: '20200108T163000',
      recurrenceId: '20200110T100000',
    });
    const entry2 = mockCalendarEntry({
      uid: 'entry-2',
      dtstart: '20200111T090000',
      dtend: '20200111T091500',
    });

    expect(
      calculateCalendarEvents({
        calendar: [entry0, entry1, entry1Override, entry2],
        fromDate: '2020-01-01T00:00:00Z',
        toDate: '2020-01-12T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-1',
        startTime: '2020-01-08T15:00:00Z',
        endTime: '2020-01-08T16:30:00Z',
        entries: [entry1, entry1Override],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-1',
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T11:00:00Z',
        entries: [entry1],
        recurrenceId: '2020-01-09T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T15:00:00Z',
        endTime: '2020-01-10T16:30:00Z',
        entries: [entry0],
        recurrenceId: '2020-01-10T15:00:00Z',
      },
      {
        uid: 'entry-2',
        startTime: '2020-01-11T09:00:00Z',
        endTime: '2020-01-11T09:15:00Z',
        entries: [entry2],
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T15:00:00Z',
        endTime: '2020-01-11T16:30:00Z',
        entries: [entry0],
        recurrenceId: '2020-01-11T15:00:00Z',
      },
    ]);
  });

  it('should include updated occurrences even if the recurrence id is before the fromDate', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200110T150000',
      dtend: '20200110T163000',
      recurrenceId: '20200101T100000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-10T00:00:00Z',
        toDate: '2020-01-11T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T15:00:00Z',
        endTime: '2020-01-10T16:30:00Z',
        entries: [rruleEntry, overrideEntry],
        recurrenceId: '2020-01-01T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
    ]);
  });

  it('should include updated occurrences even if the recurrence id is after the toDate', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200110T150000',
      dtend: '20200110T163000',
      recurrenceId: '20200112T100000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-10T00:00:00Z',
        toDate: '2020-01-11T23:59:59Z',
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-10T15:00:00Z',
        endTime: '2020-01-10T16:30:00Z',
        entries: [rruleEntry, overrideEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-11T10:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-11T10:00:00Z',
      },
    ]);
  });

  it('should apply the limit correctly if an occurrence was moved after the toDate', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY',
    });
    const overrideEntry = mockCalendarEntry({
      dtstart: '20200121T150000',
      dtend: '20200121T163000',
      recurrenceId: '20200111T100000',
    });

    expect(
      calculateCalendarEvents({
        calendar: [rruleEntry, overrideEntry],
        fromDate: '2020-01-10T00:00:00Z',
        toDate: '2020-01-19T23:59:59Z',
        limit: 3,
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-13T10:00:00Z',
        endTime: '2020-01-13T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-13T10:00:00Z',
      },
    ]);
  });

  it('should apply the limit correctly if an occurrence resorted the occurrences', () => {
    const rruleEntry = mockCalendarEntry({
      dtstart: '20200101T100000',
      dtend: '20200101T110000',
      rrule: 'FREQ=DAILY',
    });

    expect(
      calculateCalendarEvents({
        calendar: [
          rruleEntry,

          mockCalendarEntry({
            uid: 'entry-0',
            dtstart: '20200121T150000',
            dtend: '20200121T163000',
            recurrenceId: '20200111T100000',
          }),

          // this event ended earlier than fromDate
          mockCalendarEntry({
            uid: 'entry-1',
            dtstart: '20200101T100000',
            dtend: '20200101T110000',
            rrule: 'FREQ=DAILY;COUNT=1',
          }),

          // this event ends the series after the toDate
          mockCalendarEntry({
            uid: 'entry-1',
            dtstart: '20200201T100000',
            dtend: '20200201T110000',
            rrule: 'FREQ=DAILY;COUNT=1',
          }),
        ],
        fromDate: '2020-01-10T00:00:00Z',
        limit: 3,
      })
    ).toEqual([
      {
        uid: 'entry-0',
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-10T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-12T10:00:00Z',
        endTime: '2020-01-12T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-12T10:00:00Z',
      },
      {
        uid: 'entry-0',
        startTime: '2020-01-13T10:00:00Z',
        endTime: '2020-01-13T11:00:00Z',
        entries: [rruleEntry],
        recurrenceId: '2020-01-13T10:00:00Z',
      },
    ]);
  });
});
