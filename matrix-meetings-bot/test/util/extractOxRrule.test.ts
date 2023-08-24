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

import { MeetingCreateDto } from '../../src/dto/MeetingCreateDto';
import { MeetingUpdateDetailsDto } from '../../src/dto/MeetingUpdateDetailsDto';
import { extractOxRrule } from '../../src/util/extractOxRrule';

describe('extractOxRrule', () => {
  it('extract ox rrule from meeting create', () => {
    const meetingCreate = new MeetingCreateDto(
      '!parent-room-id:matrix.org',
      'Meeting title',
      'Meeting description',
      '2022-01-01T00:00:00.000Z',
      '2022-01-03T00:00:00.000Z',
      undefined,
      ['widget-0'],
      [{ user_id: '@user-id' }],
      0,
      true,
      {
        'io.ox': {
          folder: 'cal://0/301',
          id: '1',
          rrules: ['FREQ=DAILY;COUNT=1'],
        },
      },
    );

    expect(extractOxRrule(meetingCreate)).toEqual('FREQ=DAILY;COUNT=1');
  });

  it('extract ox rrule from meeting update', () => {
    const meetingUpdate = new MeetingUpdateDetailsDto(
      '!parent-room-id:matrix.org',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        'io.ox': {
          folder: 'cal://0/301',
          id: '1',
          rrules: ['FREQ=DAILY;COUNT=1'],
        },
      },
    );

    expect(extractOxRrule(meetingUpdate)).toEqual('FREQ=DAILY;COUNT=1');
  });

  it('extract only first ox rrule if several passed', () => {
    const meetingCreate = new MeetingCreateDto(
      '!parent-room-id:matrix.org',
      'Meeting title',
      'Meeting description',
      '2022-01-01T00:00:00.000Z',
      '2022-01-03T00:00:00.000Z',
      undefined,
      ['widget-0'],
      [{ user_id: '@user-id' }],
      0,
      true,
      {
        'io.ox': {
          folder: 'cal://0/301',
          id: '1',
          rrules: ['FREQ=DAILY;COUNT=1', 'FREQ=DAILY;UNTIL=20220103T000000Z'],
        },
      },
    );

    expect(extractOxRrule(meetingCreate)).toEqual('FREQ=DAILY;COUNT=1');
  });
});
