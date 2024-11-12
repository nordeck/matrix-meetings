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

import { describe, expect, it } from 'vitest';
import { mockCalendarEntry } from '../../testing';
import { extractCalendarChange } from './extractCalendarChange';

describe('extractCalendarChange', () => {
  it.each([
    {
      name: 'handle empty array',
      calendar: [],
      newCalendar: [],
    },
    {
      name: 'nothing has changed',
      calendar: [
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
          rrule: 'FREQ=DAILY',
        }),
      ],
      newCalendar: [
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
          rrule: 'FREQ=DAILY',
        }),
      ],
    },
  ])(
    'should not extract any single meeting changes for: $name',
    ({ calendar, newCalendar }) => {
      expect(extractCalendarChange(calendar, newCalendar)).toEqual([]);
    },
  );

  it('should extract updateSingleOrRecurringTime for: update existing single entry', () => {
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
    const newCalendar = [
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200111T100000',
        dtend: '20200111T110000',
      }),
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateSingleOrRecurringTime',
        uid: 'entry-0',
        oldValue: {
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
        },
        newValue: {
          dtstart: { tzid: 'UTC', value: '20200111T100000' },
          dtend: { tzid: 'UTC', value: '20200111T110000' },
        },
      },
    ]);
  });

  it('should extract updateSingleOrRecurringTime for: update existing single recurring entry', () => {
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
    const newCalendar = [
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
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateSingleOrRecurringTime',
        uid: 'entry-0',
        oldValue: {
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
        },
        newValue: {
          dtstart: { tzid: 'UTC', value: '20200111T100000' },
          dtend: { tzid: 'UTC', value: '20200111T110000' },
        },
      },
    ]);
  });

  it('should extract updateSingleOrRecurring for: update single recurring entry with existing overrides', () => {
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
    const newCalendar = [
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
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateSingleOrRecurringTime',
        uid: 'entry-0',
        oldValue: {
          dtstart: { tzid: 'UTC', value: '20200109T100000' },
          dtend: { tzid: 'UTC', value: '20200109T110000' },
        },
        newValue: {
          dtstart: { tzid: 'UTC', value: '20200111T100000' },
          dtend: { tzid: 'UTC', value: '20200111T110000' },
        },
      },
    ]);
  });

  it('should extract updateSingleOrRecurringRrule for: update existing single entry', () => {
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
    const newCalendar = [
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateSingleOrRecurringRrule',
        uid: 'entry-0',
        oldValue: undefined,
        newValue: 'FREQ=DAILY',
      },
    ]);
  });

  it('should extract updateSingleOrRecurringRrule for: update existing single recurring entry', () => {
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
    const newCalendar = [
      mockCalendarEntry({
        uid: 'entry-1',
        dtstart: '20200109T150000',
        dtend: '20200109T160000',
      }),
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY;COUNT=2',
      }),
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateSingleOrRecurringRrule',
        uid: 'entry-0',
        oldValue: 'FREQ=DAILY',
        newValue: 'FREQ=DAILY;COUNT=2',
      },
    ]);
  });

  it('should extract added occurrence for: add an updated occurrence to a single recurring meeting', () => {
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
    const newCalendar = [
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
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'addOverride',
        value: mockCalendarEntry({
          dtstart: '20200111T120000',
          dtend: '20200111T130000',
          recurrenceId: '20200111T100000',
        }),
        oldDtstart: { tzid: 'UTC', value: '20200111T100000' },
        oldDtend: { tzid: 'UTC', value: '20200111T110000' },
      },
    ]);
  });

  it('should extract updated occurrence for: update a single occurrence of a recurring meeting', () => {
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
    const newCalendar = [
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
    ];
    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'updateOverride',
        oldValue: mockCalendarEntry({
          dtstart: '20200111T103000',
          dtend: '20200111T113000',
          recurrenceId: '20200111T100000',
        }),
        value: mockCalendarEntry({
          dtstart: '20200111T120000',
          dtend: '20200111T130000',
          recurrenceId: '20200111T100000',
        }),
      },
    ]);
  });

  it.each([
    {
      name: 'delete an occurrence of a meeting',
      calendar: [
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
      ],
      newCalendar: [
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
      ],
    },
    {
      name: 'delete an occurrence of a meeting with an existing exdate',
      calendar: [
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
      ],
      newCalendar: [
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
      ],
    },
  ])(
    'should extract deleted occurrence for: $name',
    ({ calendar, newCalendar }) => {
      expect(extractCalendarChange(calendar, newCalendar)).toEqual([
        {
          changeType: 'addExdate',
          dtstart: { tzid: 'UTC', value: '20200215T100000' },
          dtend: { tzid: 'UTC', value: '20200215T110000' },
        },
      ]);
    },
  );

  it('should extract deleted occurrence for: delete existing overrides', () => {
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

    const newCalendar = [
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
    ];

    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'deleteOverride',
        value: mockCalendarEntry({
          dtstart: '20200110T103000',
          dtend: '20200110T113000',
          recurrenceId: '20200110T100000',
        }),
      },
    ]);
  });

  it('should extract deleted occurrence for: delete existing overrides when override before rrule entry', () => {
    const calendar = [
      mockCalendarEntry({
        dtstart: '20200110T103000',
        dtend: '20200110T113000',
        recurrenceId: '20200110T100000',
      }),
      mockCalendarEntry({
        dtstart: '20200109T100000',
        dtend: '20200109T110000',
        rrule: 'FREQ=DAILY',
      }),

      // another override that should stay
      mockCalendarEntry({
        dtstart: '20200115T103000',
        dtend: '20200115T113000',
        recurrenceId: '20200115T100000',
      }),
    ];

    const newCalendar = [
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
    ];

    expect(extractCalendarChange(calendar, newCalendar)).toEqual([
      {
        changeType: 'deleteOverride',
        value: mockCalendarEntry({
          dtstart: '20200110T103000',
          dtend: '20200110T113000',
          recurrenceId: '20200110T100000',
        }),
      },
    ]);
  });
});
