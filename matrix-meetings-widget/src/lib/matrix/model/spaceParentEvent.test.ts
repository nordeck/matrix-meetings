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

import { isValidSpaceParentEvent } from './spaceParentEvent';

describe('isValidSpaceParentEvent', () => {
  it('should accept event', () => {
    expect(
      isValidSpaceParentEvent({
        content: {
          via: ['server-1', 'server-2'],
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      }),
    ).toBe(true);
  });

  it('should accept event without via', () => {
    expect(
      isValidSpaceParentEvent({
        content: {},
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidSpaceParentEvent({
        content: {
          via: ['server-1', 'server-2'],
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      }),
    ).toBe(true);
  });

  it.each<Object>([
    { via: [undefined] },
    { via: null },
    { via: '111' },
    { via: {} },
    { via: false },
    { via: 111 },
    { via: [null] },
    { via: [111] },
  ])('should reject event with patch %j', (patch: Object) => {
    expect(
      isValidSpaceParentEvent({
        content: {
          via: ['server-1', 'server-2'],
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      }),
    ).toBe(false);
  });
});
