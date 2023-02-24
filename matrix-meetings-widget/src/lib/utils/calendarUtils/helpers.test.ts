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

import { mockCalendarEntry } from '../../testUtils';
import {
  createTimeFilter,
  isFiniteSeries,
  isRecurringCalendarSourceEntry,
  isSingleCalendarSourceEntry,
} from './helpers';

describe('isFiniteSeries', () => {
  it('should detect infinite series', () => {
    expect(isFiniteSeries({})).toBe(false);
  });

  it('should detect finite series with until date', () => {
    expect(isFiniteSeries({ until: new Date('2021-01-01T10:00:00Z') })).toBe(
      true
    );
  });

  it('should detect finite series with after meeting count', () => {
    expect(isFiniteSeries({ count: 5 })).toBe(true);
  });
});

describe('isSingleCalendarSourceEntry', () => {
  it('should reject undefined entry', () => {
    expect(isSingleCalendarSourceEntry(undefined)).toBe(false);
  });

  it('should accept entry with a single meeting', () => {
    expect(
      isSingleCalendarSourceEntry([
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
        }),
      ])
    ).toBe(true);
  });

  it('should reject entry with a recurring meeting', () => {
    expect(
      isSingleCalendarSourceEntry([
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
          rrule: 'FREQ=DAILY',
        }),
      ])
    ).toBe(false);
  });

  it('should reject entry with a recurring meeting and an override', () => {
    expect(
      isSingleCalendarSourceEntry([
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
      ])
    ).toBe(false);
  });
});

describe('isRecurringCalendarSourceEntry', () => {
  it('should reject undefined entry', () => {
    expect(isRecurringCalendarSourceEntry(undefined)).toBe(false);
  });

  it('should reject entry with a single meeting', () => {
    expect(
      isRecurringCalendarSourceEntry([
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
        }),
      ])
    ).toBe(false);
  });

  it('should accept entry with a recurring meeting', () => {
    expect(
      isRecurringCalendarSourceEntry([
        mockCalendarEntry({
          dtstart: '20200109T100000',
          dtend: '20200109T110000',
          rrule: 'FREQ=DAILY',
        }),
      ])
    ).toBe(true);
  });

  it('should accept entry with a recurring meeting and an override', () => {
    expect(
      isRecurringCalendarSourceEntry([
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
      ])
    ).toBe(true);
  });
});

describe('createTimeFilter', () => {
  const filter = createTimeFilter(
    '2020-01-10T00:00:00Z',
    '2020-01-10T23:59:59Z'
  );

  it('should skip meeting before filter', () => {
    expect(
      filter({
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-09T23:59:59.999Z',
      })
    ).toBe(false);
  });

  it('should skip meeting that ends on fromDate', () => {
    expect(
      filter({
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-10T00:00:00Z',
      })
    ).toBe(false);
  });

  it('should accept meeting that ends after fromDate', () => {
    expect(
      filter({
        startTime: '2020-01-09T10:00:00Z',
        endTime: '2020-01-10T00:00:00.001Z',
      })
    ).toBe(true);
  });

  it('should accept meeting that is between fromDate and toDate', () => {
    expect(
      filter({
        startTime: '2020-01-10T10:00:00Z',
        endTime: '2020-01-10T11:00:00Z',
      })
    ).toBe(true);
  });

  it('should accept meeting that starts before toDate', () => {
    expect(
      filter({
        startTime: '2020-01-10T23:59:58.999Z',
        endTime: '2020-01-11T11:00:00Z',
      })
    ).toBe(true);
  });

  it('should accept meeting that starts on toDate', () => {
    expect(
      filter({
        startTime: '2020-01-10T23:59:59Z',
        endTime: '2020-01-11T11:00:00Z',
      })
    ).toBe(true);
  });

  it('should skip meeting that starts after toDate', () => {
    expect(
      filter({
        startTime: '2020-01-11T00:00:00Z',
        endTime: '2020-01-11T11:00:00Z',
      })
    ).toBe(false);
  });
});
