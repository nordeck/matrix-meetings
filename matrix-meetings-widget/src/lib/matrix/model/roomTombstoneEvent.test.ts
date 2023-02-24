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

import { isValidRoomTombstoneEvent } from './roomTombstoneEvent';

describe('isValidRoomTombstoneEvent', () => {
  it('should accept event', () => {
    expect(
      isValidRoomTombstoneEvent({
        content: {},
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'm.room.tombstone',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidRoomTombstoneEvent({
        content: {
          additional: 'tmp',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'm.room.tombstone',
      })
    ).toBe(true);
  });

  it('should reject invalid event type', () => {
    expect(
      isValidRoomTombstoneEvent({
        content: {},
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'any.other.type',
      })
    ).toBe(false);
  });
});
