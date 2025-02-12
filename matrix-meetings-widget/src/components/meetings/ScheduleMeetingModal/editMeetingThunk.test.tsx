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

import { describe, expect, it } from 'vitest';
import { mockMeeting, mockRoomMember } from '../../../lib/testUtils';
import { Meeting } from '../../../reducer/meetingsApi';
import { diffMeeting } from './editMeetingThunk';
import { CreateMeeting } from './types';

describe('diffMeeting', () => {
  it('should find difference between old and updated meeting', () => {
    const oldMeeting: Meeting = mockMeeting({
      content: {
        participants: [
          {
            userId: '@alice-user',
            displayName: 'Alice',
            membership: 'join',
            rawEvent: mockRoomMember({ room_id: '!meeting-room-id' }),
          },
          {
            userId: '@bob-user',
            displayName: 'Bob',
            membership: 'join',
            rawEvent: mockRoomMember({ room_id: '!meeting-room-id' }),
          },
        ],
        widgets: ['poll', 'jitsi', 'whiteboard'],
      },
    });

    const newMeeting: CreateMeeting = {
      title: 'My new Meeting',
      description: 'My new Description',
      startTime: '2040-10-29T12:00:00.000Z',
      endTime: '2040-10-29T13:00:00.000Z',
      participants: ['@alice-user', '@charlie-user'],
      widgetIds: ['poll', 'poll_groups'],
    };

    const availableWidgets = [
      'jitsi',
      'etherpad',
      'whiteboard',
      'poll',
      'poll_groups',
    ];

    expect(
      diffMeeting(oldMeeting, true, newMeeting, availableWidgets, []),
    ).toEqual({
      addUserIds: ['@charlie-user'],
      removeUserIds: ['@bob-user'],
      addWidgets: ['poll_groups'],
      removeWidgets: ['jitsi', 'whiteboard'],
      meetingDetails: {
        description: 'My new Description',
        calendar: [
          {
            uid: 'entry-0',
            dtstart: { tzid: 'UTC', value: '20401029T120000' },
            dtend: { tzid: 'UTC', value: '20401029T130000' },
          },
        ],
        title: 'My new Meeting',
      },
      powerLevels: {},
    });
  });
});
