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

import { isValidWidgetsEvent } from './widgetsEvent';

describe('isValidWidgetsEvent', () => {
  it('should accept im.vector.modular.widgets event', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          type: 'jitsi',
          url: 'https://…',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'im.vector.modular.widgets',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          type: 'jitsi',
          url: 'https://…',
          additional: 'data',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'im.vector.modular.widgets',
      }),
    ).toBe(true);
  });

  it('should reject invalid event type', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          type: 'jitsi',
          url: 'https://…',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'any.other.type',
      }),
    ).toBe(false);
  });

  it.each<Object>([
    { type: undefined },
    { type: null },
    { type: 111 },
    { url: undefined },
    { url: null },
    { url: 111 },
  ])('should reject event with patch %j', (patch: Object) => {
    expect(
      isValidWidgetsEvent({
        content: {
          type: 'jitsi',
          url: 'https://…',
          ...patch,
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        state_key: '',
        type: 'im.vector.modular.widgets',
      }),
    ).toBe(false);
  });
});
