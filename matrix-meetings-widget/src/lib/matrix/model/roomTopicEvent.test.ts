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
import { isValidRoomTopicEvent } from './roomTopicEvent';

describe('isValidRoomTopicEvent', () => {
  it('should accept event', () => {
    expect(
      isValidRoomTopicEvent({
        content: {
          topic: 'Topic',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.room.topic',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidRoomTopicEvent({
        content: {
          topic: 'Topic',
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.room.topic',
      }),
    ).toBe(true);
  });

  it('should accept event with empty topic', () => {
    expect(
      isValidRoomTopicEvent({
        content: {
          topic: '',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.room.topic',
      }),
    ).toBe(true);
  });

  it.each<Object>([{ topic: undefined }, { topic: null }, { topic: 111 }])(
    'should reject event with patch %j',
    (patch: Object) => {
      expect(
        isValidRoomTopicEvent({
          content: {
            topic: 'Topic',
            ...patch,
          },
          event_id: '$event-id',
          origin_server_ts: 0,
          room_id: '!room-id',
          state_key: '',
          sender: '@user-id',
          type: 'm.room.topic',
        }),
      ).toBe(false);
    },
  );
});
