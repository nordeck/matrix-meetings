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

import { CalendarEntryDto } from '../../src/dto/CalendarEntryDto';
import { IMeetingTime, migrateMeetingTime } from '../../src/util/IMeetingTime';

describe('IMeetingTime', () => {
  it('migrateMeetingTime should change to calendar model', () => {
    expect(
      migrateMeetingTime(
        {
          start_time: '2022-01-01T00:00:00.000Z',
          end_time: '2022-01-03T00:00:00.000Z',
          calendar: undefined,
        },
        'FREQ=DAILY;COUNT=1'
      )
    ).toEqual({
      start_time: undefined,
      end_time: undefined,
      calendar: [
        {
          uid: expect.any(String),
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: 'FREQ=DAILY;COUNT=1',
        },
      ],
    } as IMeetingTime);
  });

  it.each<{
    calendar: CalendarEntryDto[] | undefined;
    externalRrule: string | undefined;
  }>([
    { calendar: undefined, externalRrule: undefined },
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
  ])(
    'migrateMeetingTime should not change meeting time with %s',
    ({ calendar, externalRrule }) => {
      const meetingTime = migrateMeetingTime(
        {
          start_time: '2022-01-01T00:00:00.000Z',
          end_time: '2022-01-03T00:00:00.000Z',
          calendar,
        },
        externalRrule
      );

      expect(meetingTime).toBe(meetingTime);
    }
  );
});
