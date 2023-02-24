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

import { CalendarEntryDto, DateTimeEntryDto } from '../dto/CalendarEntryDto';
import {
  getForceDeletionTime,
  getMeetingEndTime,
  getMeetingStartTime,
} from './calendarUtils';

let startTime: string;
let endTime: string;
let calendar: CalendarEntryDto[];
let calendarWithRRule: CalendarEntryDto[];

beforeEach(() => {
  startTime = '2020-01-01T00:00:00Z';
  endTime = '2020-01-01T01:00:00Z';
  calendar = [
    new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200102T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200102T010000')
    ),
  ];
  calendarWithRRule = [
    new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200102T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200102T010000'),
      'FREQ=DAILY;COUNT=3'
    ),
  ];
});

describe('getMeetingStartTime', () => {
  it('should use start_time', () => {
    expect(getMeetingStartTime(startTime, undefined)).toBe(
      '2020-01-01T00:00:00Z'
    );
  });

  it('should use calendar', () => {
    expect(getMeetingStartTime(undefined, calendar)).toBe(
      '2020-01-02T00:00:00+01:00'
    );
  });

  it('should prefer calendar if both values are defined', () => {
    expect(getMeetingStartTime(startTime, calendar)).toBe(
      '2020-01-02T00:00:00+01:00'
    );
  });

  it('should throw if both values are undefined', () => {
    expect(() => getMeetingStartTime(undefined, undefined)).toThrowError(
      'Unexpected input: Both start_time and calendar are undefined'
    );
  });
});

describe('getMeetingEndTime', () => {
  it('should use end_time', () => {
    expect(getMeetingEndTime(endTime, undefined)).toBe('2020-01-01T01:00:00Z');
  });

  it('should use calendar', () => {
    expect(getMeetingEndTime(undefined, calendar)).toBe(
      '2020-01-02T01:00:00+01:00'
    );
  });

  it('should prefer calendar if both values are defined', () => {
    expect(getMeetingEndTime(endTime, calendar)).toBe(
      '2020-01-02T01:00:00+01:00'
    );
  });

  it('should throw if both values are undefined', () => {
    expect(() => getMeetingEndTime(undefined, undefined)).toThrowError(
      'Unexpected input: Both end_time and calendar are undefined'
    );
  });
});

describe('getForceDeletionTime', () => {
  it('should generate force_deletion_time', () => {
    expect(getForceDeletionTime(60, calendar)).toBe(
      new Date('2020-01-02T02:00:00+01:00').getTime()
    );
  });

  it('should generate force_deletion_time for calendar with rrule', () => {
    expect(getForceDeletionTime(60, calendarWithRRule)).toBe(
      new Date('2020-01-04T02:00:00+01:00').getTime()
    );
  });

  it('should generate force_deletion_time with offset 0', () => {
    expect(getForceDeletionTime(0, calendar)).toBe(
      new Date('2020-01-02T01:00:00+01:00').getTime()
    );
  });

  it('should generate force_deletion_time with negative offset that falls back to 0', () => {
    expect(getForceDeletionTime(-1, calendar)).toBe(
      new Date('2020-01-02T01:00:00+01:00').getTime()
    );
  });

  it('should skip generation if auto_deletion_offset is undefined', () => {
    expect(getForceDeletionTime(undefined, calendar)).toBeUndefined();
  });

  it('should skip generation if calendar is undefined', () => {
    expect(getForceDeletionTime(60, undefined)).toBeUndefined();
  });

  it('should skip generation if both values are undefined', () => {
    expect(getForceDeletionTime(undefined, undefined)).toBeUndefined();
  });
});
