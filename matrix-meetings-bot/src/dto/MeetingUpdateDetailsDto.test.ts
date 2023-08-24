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

import { validate } from 'class-validator';
import { CalendarEntryDto, DateTimeEntryDto } from './CalendarEntryDto';
import { MeetingUpdateDetailsDto } from './MeetingUpdateDetailsDto';

describe('MeetingUpdateDetailsDto', () => {
  it('should accept event', async () => {
    const input = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it('should accept event with all optional fields', async () => {
    const input = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      undefined,
      undefined,
      [
        new CalendarEntryDto(
          'uuid',
          new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
          new DateTimeEntryDto('Europe/Berlin', '20200101T010000'),
        ),
      ],
      'Meeting title',
      'Meeting description',
      { 'my.provider': { 'my.property': 'text' } },
    );

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  it.each([
    { target_room_id: 111 },
    { target_room_id: 'not-a-room-id' },
    { title: 111 },
    { description: 111 },
    { calendar: 111 },
    { calendar: [null] },
    { calendar: [undefined] },
    { calendar: [111] },
    { external_data: 111 },
  ])('should reject event with patch %p', async (patch) => {
    const input = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      undefined,
      undefined,
      [
        new CalendarEntryDto(
          'uuid',
          new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
          new DateTimeEntryDto('Europe/Berlin', '20200101T010000'),
        ),
      ],
      'Meeting title',
      'Meeting description',
      { 'my.provider': { 'my.property': 'text' } },
    );

    Object.entries(patch).forEach(([key, value]) => {
      (input as any)[key] = value;
    });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });

  it('should accept event in the legacy format', async () => {
    const input = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      '2020-01-01T00:00:00Z',
      '2020-01-01T01:00:00Z',
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await expect(validate(input)).resolves.toHaveLength(0);
  });

  const calendar = [
    new CalendarEntryDto(
      'uuid',
      new DateTimeEntryDto('Europe/Berlin', '20200101T000000'),
      new DateTimeEntryDto('Europe/Berlin', '20200101T010000'),
    ),
  ];

  it.each([
    { start_time: undefined },
    { start_time: null },
    { start_time: 111 },
    { start_time: 'invalid-date' },
    { end_time: undefined },
    { end_time: null },
    { end_time: 111 },
    { end_time: 'invalid-date' },
    { calendar },
    { calendar, start_time: undefined },
    { calendar, end_time: undefined },
  ])('should reject legacy format event with patch %p', async (patch) => {
    const input = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      '2020-01-01T00:00:00Z',
      '2020-01-01T01:00:00Z',
      undefined,
      undefined,
      undefined,
      undefined,
    );

    Object.entries(patch).forEach(([key, value]) => {
      (input as any)[key] = value;
    });

    await expect(validate(input)).resolves.not.toHaveLength(0);
  });
});
