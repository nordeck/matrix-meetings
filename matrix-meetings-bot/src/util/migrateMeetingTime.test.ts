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

import { CalendarEntryDto } from '../dto/CalendarEntryDto';
import { mockCalendarEntry } from '../testUtils';
import { migrateMeetingTime } from './migrateMeetingTime';

describe('migrateMeetingTime', () => {
  it('should migrate', () => {
    expect(
      migrateMeetingTime({
        start_time: '2020-01-01T08:00:00.000Z',
        end_time: '2020-01-01T10:00:00.000Z',
        calendar: undefined,
      }),
    ).toEqual([
      {
        uid: expect.any(String),
        dtstart: { tzid: 'UTC', value: '20200101T080000' },
        dtend: { tzid: 'UTC', value: '20200101T100000' },
      },
    ]);
  });

  it('should migrate when single entry calendar', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        undefined,
        [
          mockCalendarEntry({
            dtstart: '20200109T100000',
            dtend: '20200109T110000',
          }),
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
      }),
    ]);
  });

  it('should migrate single recurring entry calendar', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        undefined,
        [
          mockCalendarEntry({
            dtstart: '20200109T100000',
            dtend: '20200109T110000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
      }),
    ]);
  });

  it('should migrate when single recurring entry with existing overrides', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        undefined,
        [
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
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
      }),
    ]);
  });

  it('should migrate when rrule', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1',
        undefined,
      ),
    ).toEqual([
      {
        uid: expect.any(String),
        dtstart: { tzid: 'UTC', value: '20200101T080000' },
        dtend: { tzid: 'UTC', value: '20200101T100000' },
        rrule: 'FREQ=DAILY;COUNT=1',
      },
    ]);
  });

  it('should migrate when rrule and single entry calendar', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1',
        [
          mockCalendarEntry({
            dtstart: '20200109T100000',
            dtend: '20200109T110000',
          }),
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
        rrule: 'FREQ=DAILY;COUNT=1',
      }),
    ]);
  });

  it('should migrate when rrule and single recurring entry calendar', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1',
        [
          mockCalendarEntry({
            dtstart: '20200109T100000',
            dtend: '20200109T110000',
            rrule: 'FREQ=DAILY',
          }),
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
        rrule: 'FREQ=DAILY;COUNT=1',
      }),
    ]);
  });

  it('should migrate when rrule and single recurring entry with existing overrides', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1',
        [
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
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
        rrule: 'FREQ=DAILY;COUNT=1',
      }),
    ]);
  });

  it('should migrate when rrule and single recurring entry with existing overrides reordered', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2020-01-01T08:00:00.000Z',
          end_time: '2020-01-01T10:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1',
        [
          mockCalendarEntry({
            dtstart: '20200111T120000',
            dtend: '20200111T130000',
            recurrenceId: '20200111T100000',
          }),
          mockCalendarEntry({
            dtstart: '20200109T100000',
            dtend: '20200109T110000',
            rrule: 'FREQ=DAILY',
            exdate: ['20200110T100000'],
          }),
        ],
      ),
    ).toEqual([
      mockCalendarEntry({
        dtstart: '20200101T080000',
        dtend: '20200101T100000',
        rrule: 'FREQ=DAILY;COUNT=1',
      }),
    ]);
  });

  it.each<{
    calendar: CalendarEntryDto[] | undefined;
    externalRrule: string | undefined;
  }>([
    { calendar: [], externalRrule: undefined },
    { calendar: [], externalRrule: 'FREQ=DAILY;COUNT=1' },
    {
      calendar: [
        {
          uid: 'some-id',
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: 'FREQ=DAILY;COUNT=1',
        },
      ],
      externalRrule: undefined,
    },
  ])('should fail with %s', ({ calendar, externalRrule }) => {
    const meetingTime = {
      start_time: '2022-01-01T00:00:00.000Z',
      end_time: '2022-01-03T00:00:00.000Z',
      calendar,
    };

    expect(() =>
      migrateMeetingTime(meetingTime, externalRrule, undefined),
    ).toThrowError(
      'Unexpected input: either start_time with end_time or calendar should be provided',
    );
  });
});
