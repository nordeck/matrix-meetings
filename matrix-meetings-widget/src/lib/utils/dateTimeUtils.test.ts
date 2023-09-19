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
import { mockDateTimeFormatTimeZone } from '../../timezoneMockUtils';
import { mockMeeting } from '../testUtils';
import {
  formatICalDate,
  isMeetingSpanningMultipleDays,
  isMeetingSpanningMultipleYears,
  parseICalDate,
  toISOString,
} from './dateTimeUtils';

describe('isMeetingSpanningMultipleDays', () => {
  it('should be false if start and end time are at the same day', () => {
    expect(isMeetingSpanningMultipleDays(mockMeeting())).toEqual(false);
  });

  it('should be true if start and end time are at the different days', () => {
    expect(
      isMeetingSpanningMultipleDays(
        mockMeeting({
          content: {
            startTime: '2999-01-01T10:00:00Z',
            endTime: '2999-01-05T14:00:00Z',
          },
        }),
      ),
    ).toEqual(true);
  });
});

describe('isMeetingSpanningMultipleYears', () => {
  it('should be false if start and end time are at the same year', () => {
    expect(isMeetingSpanningMultipleYears(mockMeeting())).toEqual(false);
  });

  it('should be true if start and end time are at the different years', () => {
    expect(
      isMeetingSpanningMultipleYears(
        mockMeeting({
          content: {
            startTime: '2999-01-01T10:00:00Z',
            endTime: '3000-01-01T14:00:00Z',
          },
        }),
      ),
    ).toEqual(true);
  });
});

describe('parseICalDate', () => {
  it.each`
    input                | output
    ${'20221029T100000'} | ${'2022-10-29T10:00:00.000Z'}
    ${'20221030T100000'} | ${'2022-10-30T10:00:00.000Z'}
    ${'20221030T180000'} | ${'2022-10-30T18:00:00.000Z'}
  `('should parse $input', ({ input, output }) => {
    expect(parseICalDate({ value: input, tzid: 'UTC' }).toISO()).toBe(output);
  });

  it.each`
    input                | output
    ${'20221029T100000'} | ${'2022-10-29T10:00:00.000+02:00'}
    ${'20221030T100000'} | ${'2022-10-30T10:00:00.000+01:00'}
    ${'20221030T180000'} | ${'2022-10-30T18:00:00.000+01:00'}
  `('should parse $input with Europe/Berlin timezone', ({ input, output }) => {
    expect(parseICalDate({ value: input, tzid: 'Europe/Berlin' }).toISO()).toBe(
      output,
    );
  });
});

describe('formatICalDate', () => {
  it.each`
    input                     | value
    ${'2022-10-29T10:00:00Z'} | ${'20221029T100000'}
    ${'2022-10-30T10:00:00Z'} | ${'20221030T100000'}
    ${'2022-10-30T18:00:00Z'} | ${'20221030T180000'}
  `('should format $input', ({ input, value }) => {
    expect(formatICalDate(new Date(input))).toEqual({
      value,
      tzid: 'UTC',
    });
  });

  it.each`
    input                     | value
    ${'2022-10-29T08:00:00Z'} | ${'20221029T100000'}
    ${'2022-10-30T09:00:00Z'} | ${'20221030T100000'}
    ${'2022-10-30T17:00:00Z'} | ${'20221030T180000'}
  `('should format $input with Europe/Berlin timezone', ({ input, value }) => {
    expect(formatICalDate(DateTime.fromISO(input), 'Europe/Berlin')).toEqual({
      value,
      tzid: 'Europe/Berlin',
    });
  });
});

describe('toISOString', () => {
  it('should format javascript Date', () => {
    expect(toISOString(new Date('2022-10-29T08:00:00Z'))).toBe(
      '2022-10-29T08:00:00Z',
    );
  });

  it('should format javascript Date in another timezone', () => {
    mockDateTimeFormatTimeZone('Europe/Berlin');
    expect(toISOString(new Date('2022-10-29T09:00:00+01:00'))).toBe(
      '2022-10-29T08:00:00Z',
    );
  });

  it('should format luxon DateTime', () => {
    expect(toISOString(DateTime.fromISO('2022-10-29T08:00:00Z'))).toBe(
      '2022-10-29T08:00:00Z',
    );
  });

  it('should format luxon DateTime in another timezone', () => {
    mockDateTimeFormatTimeZone('Europe/Berlin');
    expect(toISOString(DateTime.fromISO('2022-10-29T09:00:00+01:00'))).toBe(
      '2022-10-29T08:00:00Z',
    );
  });
});
