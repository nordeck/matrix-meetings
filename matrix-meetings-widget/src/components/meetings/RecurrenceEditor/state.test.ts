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
import { Frequency } from 'rrule';
import { describe, expect, it } from 'vitest';
import {
  CustomRuleMode,
  RecurrenceEnd,
  RecurrencePreset,
  reducer,
  storeInitializer,
  toRule,
} from './state';

describe('storeInitializer', () => {
  const initialStartDate = new Date('2022-10-07T14:15:00.000Z');

  it('should initialize to no recurrence', () => {
    expect(
      storeInitializer({
        initialRule: undefined,
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: initialStartDate,
      recurrencePreset: RecurrencePreset.Once,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2027-10-07T23:59:59.999Z'),
      afterMeetingCount: '5',
    });
  });

  it('should initialize to daily preset', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=DAILY',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-11-06T23:59:59.999Z'),
      afterMeetingCount: '30',
    });
  });

  it('should initialize to weekly preset', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=WEEKLY',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Weekly,
      customFrequency: Frequency.WEEKLY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-01-06T23:59:59.999Z'),
      afterMeetingCount: '13',
    });
  });

  it('should initialize to Monday to Friday preset', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.MondayToFriday,
      customFrequency: Frequency.WEEKLY,
      customInterval: '1',
      customByWeekday: [0, 1, 2, 3, 4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 0,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-01-06T23:59:59.999Z'),
      afterMeetingCount: '13',
    });
  });

  it('should initialize to monthly preset', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=MONTHLY',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Monthly,
      customFrequency: Frequency.MONTHLY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-10-07T23:59:59.999Z'),
      afterMeetingCount: '12',
    });
  });

  it('should initialize to yearly preset', () => {
    expect(
      storeInitializer({
        initialRule: 'RRULE:FREQ=YEARLY',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Yearly,
      customFrequency: Frequency.YEARLY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2027-10-07T23:59:59.999Z'),
      afterMeetingCount: '5',
    });
  });

  it('should initialize to custom preset that is occurring every second day', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=DAILY;INTERVAL=2',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '2',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-11-06T23:59:59.999Z'),
      afterMeetingCount: '30',
    });
  });

  it('should initialize to custom preset that is occurring every Monday', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=WEEKLY;BYDAY=MO',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.WEEKLY,
      customInterval: '1',
      customByWeekday: [0],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 0,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-01-06T23:59:59.999Z'),
      afterMeetingCount: '13',
    });
  });

  it('should initialize to custom preset that is occurring every last Monday every month', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=DAILY;INTERVAL=1;BYDAY=MO;BYSETPOS=-1',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [0],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: -1,
      customNthMonthday: '7',
      customWeekday: 0,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-11-06T23:59:59.999Z'),
      afterMeetingCount: '30',
    });
  });

  it('should initialize to custom preset that is occurring on the 7th every month', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=7',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.MONTHLY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-10-07T23:59:59.999Z'),
      afterMeetingCount: '12',
    });
  });

  it('should initialize to custom preset that is occurring every third Monday in February every year', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=YEARLY;INTERVAL=1;BYDAY=MO;BYMONTH=2;BYSETPOS=3',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.YEARLY,
      customInterval: '1',
      customByWeekday: [0],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 2,
      customNth: 3,
      customNthMonthday: '7',
      customWeekday: 0,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2027-10-07T23:59:59.999Z'),
      afterMeetingCount: '5',
    });
  });

  it('should initialize to custom preset that is occurring every 24th December every year', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=YEARLY;INTERVAL=1;BYMONTH=12;BYMONTHDAY=24',
        initialStartDate: new Date('2022-12-24T14:15:00.000Z'),
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-12-24T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.YEARLY,
      customInterval: '1',
      customByWeekday: [5],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 12,
      customNth: 4,
      customNthMonthday: '24',
      customWeekday: 5,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2027-12-24T23:59:59.999Z'),
      afterMeetingCount: '5',
    });
  });

  it('should initialize to custom preset that is occurring every fourth Tuesday every month (from OX)', () => {
    expect(
      storeInitializer({
        // OX isn't including an interval if it's the default value
        initialRule: 'FREQ=MONTHLY;BYDAY=TU;BYSETPOS=4',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.MONTHLY,
      customInterval: '1',
      customByWeekday: [1],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 4,
      customNthMonthday: '7',
      customWeekday: 1,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2023-10-07T23:59:59.999Z'),
      afterMeetingCount: '12',
    });
  });

  it('should initialize with until date', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=DAILY;UNTIL=20221030T140000Z',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.UntilDate,
      untilDate: DateTime.fromISO('2022-10-30T14:00:00.000Z'),
      afterMeetingCount: '30',
    });
  });

  it('should initialize with end after meeting count', () => {
    expect(
      storeInitializer({
        initialRule: 'FREQ=DAILY;COUNT=14',
        initialStartDate,
      }),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T14:15:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.AfterMeetingCount,
      untilDate: DateTime.fromISO('2022-11-06T23:59:59.999Z'),
      afterMeetingCount: '14',
    });
  });
});

describe('reducer', () => {
  it('should update start date and default during meeting creation', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateStartDate',
          startDate: new Date('2022-05-06T12:00:00.000Z'),
          isMeetingCreation: true,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-05-06T12:00:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [4],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 5,
      customNth: 1,
      customNthMonthday: '6',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-06-05T23:59:59.999Z'),
      afterMeetingCount: '30',
    });
  });

  it('should only update start after meeting creation', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateStartDate',
          startDate: new Date('2022-05-06T12:00:00.000Z'),
          isMeetingCreation: false,
        },
      ),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-05-06T12:00:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should not update start date if unchanged', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-10-07T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateStartDate',
          startDate: new Date('2022-10-07T13:10:00.000Z'),
          isMeetingCreation: true,
        },
      ),
    ).toEqual({
      isDirty: false,
      startDate: new Date('2022-10-07T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update recurrence preset', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [0, 1, 2, 3, 4],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateRecurrencePreset',
          recurrencePreset: RecurrencePreset.Weekly,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Weekly,
      customFrequency: Frequency.WEEKLY,
      customInterval: '1',
      customByWeekday: [6],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 1,
      customNth: 1,
      customNthMonthday: '2',
      customWeekday: 6,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-04-03T23:59:59.999Z'),
      afterMeetingCount: '13',
    });
  });

  it('should update custom frequency', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [0],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomFrequency',
          customFrequency: Frequency.WEEKLY,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.WEEKLY,
      customInterval: '1',
      customByWeekday: [6],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 1,
      customNth: 1,
      customNthMonthday: '2',
      customWeekday: 6,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom interval', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomInterval',
          customInterval: '2',
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '2',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom by weekday', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomByWeekday',
          customByWeekday: [0],
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [0],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom rule mode', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomRuleMode',
          customRuleMode: CustomRuleMode.ByMonthday,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom rule month', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByMonthday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomMonth',
          customMonth: 11,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 11,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom rule n-th monthday', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByMonthday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomNthMonthday',
          customNthMonthday: '8',
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '8',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom rule weekday', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByMonthday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomWeekday',
          customWeekday: 5,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 5,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update custom rule n-th', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByMonthday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateCustomNth',
          customNth: 2,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Custom,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByMonthday,
      customMonth: 10,
      customNth: 2,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.Never,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update recurrence end', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateRecurrenceEnd',
          recurrenceEnd: RecurrenceEnd.UntilDate,
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.UntilDate,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });

  it('should update after meeting count', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.AfterMeetingCount,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateAfterMeetingCount',
          afterMeetingCount: '15',
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.AfterMeetingCount,
      untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
      afterMeetingCount: '15',
    });
  });

  it('should update until date', () => {
    expect(
      reducer(
        {
          isDirty: false,
          startDate: new Date('2022-01-02T13:10:00.000Z'),
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.UntilDate,
          untilDate: DateTime.fromISO('2022-03-02T13:10:00.000Z'),
          afterMeetingCount: '10',
        },
        {
          type: 'updateUntilDate',
          untilDate: DateTime.fromISO('2022-04-02T13:10:00.000Z'),
        },
      ),
    ).toEqual({
      isDirty: true,
      startDate: new Date('2022-01-02T13:10:00.000Z'),
      recurrencePreset: RecurrencePreset.Daily,
      customFrequency: Frequency.DAILY,
      customInterval: '1',
      customByWeekday: [],
      customRuleMode: CustomRuleMode.ByWeekday,
      customMonth: 10,
      customNth: 1,
      customNthMonthday: '7',
      customWeekday: 4,
      recurrenceEnd: RecurrenceEnd.UntilDate,
      untilDate: DateTime.fromISO('2022-04-02T13:10:00.000Z'),
      afterMeetingCount: '10',
    });
  });
});

describe('toRule', () => {
  const startDate = new Date('2022-01-02T13:10:00.000Z');

  it('should create rrule with once preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Once,
        customFrequency: Frequency.DAILY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: undefined,
    });
  });

  it('should create rrule with daily preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Daily,
        customFrequency: Frequency.DAILY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=DAILY',
    });
  });

  it('should create rrule with weekly preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Weekly,
        customFrequency: Frequency.WEEKLY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=WEEKLY',
    });
  });

  it('should create rrule with Monday to Friday preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.MondayToFriday,
        customFrequency: Frequency.WEEKLY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    });
  });

  it('should create rrule with monthly preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Monthly,
        customFrequency: Frequency.MONTHLY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=MONTHLY',
    });
  });

  it('should create rrule with yearly preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Yearly,
        customFrequency: Frequency.YEARLY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=YEARLY',
    });
  });

  it('should create rrule with custom preset', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.DAILY,
        customInterval: '2',
        customByWeekday: [0, 1, 2, 3, 4],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=DAILY;INTERVAL=2',
    });
  });

  it('should create rrule with custom preset on workdays every second week', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.WEEKLY,
        customInterval: '2',
        customByWeekday: [0, 1, 2, 3, 4],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU,WE,TH,FR',
    });
  });

  it('should create rrule with custom preset that is occurring every last Monday every month', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.MONTHLY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: -1,
        customNthMonthday: '7',
        customWeekday: 0,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=MONTHLY;INTERVAL=1;BYSETPOS=-1;BYDAY=MO',
    });
  });

  it('should create rrule with custom preset that is occurring on the 5th every month', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.MONTHLY,
        customInterval: '1',
        customByWeekday: [0, 1, 2, 3, 4],
        customRuleMode: CustomRuleMode.ByMonthday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '5',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=5',
    });
  });

  it('should create rrule with custom preset that is occurring every third Monday in February every year', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.YEARLY,
        customInterval: '1',
        customByWeekday: [0, 1, 2, 3, 4],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 2,
        customNth: 3,
        customNthMonthday: '7',
        customWeekday: 0,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=YEARLY;INTERVAL=1;BYSETPOS=3;BYDAY=MO;BYMONTH=2',
    });
  });

  it('should create rrule with custom preset that is occurring every 24th December every year', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Custom,
        customFrequency: Frequency.YEARLY,
        customInterval: '1',
        customByWeekday: [0, 1, 2, 3, 4],
        customRuleMode: CustomRuleMode.ByMonthday,
        customMonth: 12,
        customNth: 1,
        customNthMonthday: '24',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.Never,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=YEARLY;INTERVAL=1;BYMONTHDAY=24;BYMONTH=12',
    });
  });

  it('should create rrule with end after meeting count', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Daily,
        customFrequency: Frequency.DAILY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.AfterMeetingCount,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=DAILY;COUNT=10',
    });
  });

  it('should create rrule with until date', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Daily,
        customFrequency: Frequency.DAILY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.UntilDate,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
      }),
    ).toEqual({
      isValid: true,
      rrule: 'FREQ=DAILY;UNTIL=20231007T141500Z',
    });
  });

  it.each(['', '0'])(
    'should be invalid on invalid after meeting count (%s)',
    (afterMeetingCount) => {
      expect(
        toRule({
          isDirty: false,
          startDate,
          recurrencePreset: RecurrencePreset.Daily,
          customFrequency: Frequency.DAILY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.AfterMeetingCount,
          afterMeetingCount,
          untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
        }),
      ).toEqual({
        isValid: false,
        rrule: 'FREQ=DAILY',
      });
    },
  );

  it('should be invalid on invalid until date', () => {
    expect(
      toRule({
        isDirty: false,
        startDate,
        recurrencePreset: RecurrencePreset.Daily,
        customFrequency: Frequency.DAILY,
        customInterval: '1',
        customByWeekday: [],
        customRuleMode: CustomRuleMode.ByWeekday,
        customMonth: 10,
        customNth: 1,
        customNthMonthday: '7',
        customWeekday: 4,
        recurrenceEnd: RecurrenceEnd.UntilDate,
        afterMeetingCount: '10',
        untilDate: DateTime.fromISO(''),
      }),
    ).toEqual({
      isValid: false,
      rrule: 'FREQ=DAILY',
    });
  });

  it.each(['t', '0'])(
    'should be invalid on invalid interval (%s)',
    (customInterval) => {
      expect(
        toRule({
          isDirty: false,
          startDate,
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.DAILY,
          customInterval,
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByWeekday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday: '7',
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          afterMeetingCount: '10',
          untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
        }),
      ).toEqual({
        isValid: false,
        rrule: 'FREQ=DAILY',
      });
    },
  );

  it.each(['t', '0', '32'])(
    'should be invalid on invalid nth monthday (%s)',
    (customNthMonthday) => {
      expect(
        toRule({
          isDirty: false,
          startDate,
          recurrencePreset: RecurrencePreset.Custom,
          customFrequency: Frequency.MONTHLY,
          customInterval: '1',
          customByWeekday: [],
          customRuleMode: CustomRuleMode.ByMonthday,
          customMonth: 10,
          customNth: 1,
          customNthMonthday,
          customWeekday: 4,
          recurrenceEnd: RecurrenceEnd.Never,
          afterMeetingCount: '10',
          untilDate: DateTime.fromISO('2023-10-07T14:15:00.000Z'),
        }),
      ).toEqual({
        isValid: false,
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
      });
    },
  );
});
