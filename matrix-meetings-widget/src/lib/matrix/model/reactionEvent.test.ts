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

import { isValidReactionEvent } from './reactionEvent';

describe('validateReactionEvent', () => {
  it('should accept event', () => {
    expect(
      isValidReactionEvent({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
          },
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        type: 'm.reaction',
      }),
    ).toBe(true);
  });

  it('should accept event with meta', () => {
    expect(
      isValidReactionEvent({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
          },
          'net.nordeck.meetings.bot.meta': {
            room_id: '!id',
          },
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        type: 'm.reaction',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidReactionEvent({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
            additional: 'tmp',
          },
          'net.nordeck.meetings.bot.meta': {
            room_id: '!id',
            additional: 'tmp',
          },
          additional: 'tmp',
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        type: 'm.reaction',
      }),
    ).toBe(true);
  });

  it('should reject invalid event type', () => {
    expect(
      isValidReactionEvent({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
          },
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        type: 'any.other.type',
      }),
    ).toBe(false);
  });

  it.each<Object>([
    { 'm.relates_to': undefined },
    { 'm.relates_to': null },
    { 'm.relates_to': 111 },
    { 'm.relates_to': {} },
    {
      'm.relates_to': {
        rel_type: undefined,
        event_id: '$other-id',
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: null,
        event_id: '$other-id',
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: 111,
        event_id: '$other-id',
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: undefined,
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: null,
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: 111,
        key: '✅',
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: '$other-id',
        key: undefined,
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: '$other-id',
        key: null,
      },
    },
    {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: '$other-id',
        key: 111,
      },
    },
    {
      'net.nordeck.meetings.bot.meta': {
        room_id: 111,
      },
    },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidReactionEvent({
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: '$other-id',
            key: '✅',
          },
          'net.nordeck.meetings.bot.meta': {
            room_id: '!id',
          },
          ...patch,
        },
        event_id: '$id',
        origin_server_ts: 0,
        room_id: '!room',
        sender: '@sender',
        type: 'm.reaction',
      }),
    ).toBe(false);
  });
});
