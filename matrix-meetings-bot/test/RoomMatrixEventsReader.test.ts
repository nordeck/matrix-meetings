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

import {
  RoomMatrixEventsReader,
  schema,
} from '../src/io/RoomMatrixEventsReader';

describe('RoomMatrixEventsReader', () => {
  test('read test', async () => {
    const events = new RoomMatrixEventsReader(
      'test/conf/test_default_events.json'
    ).read();
    expect(events.stateEvents.length).toBe(8);
    expect(events.roomEvents).toStrictEqual([]);
    expect(events.allWidgetIds).toEqual([
      'jitsi',
      'etherpad',
      'whiteboard',
      'poll',
    ]);
    expect(events.defaultWidgetIds).toEqual([
      'jitsi',
      'etherpad',
      'whiteboard',
    ]);
    expect(events.widgetContents.length).toBe(4);

    events.widgetContents.forEach((o) => {
      if (!o) throw new Error('undefined widgetContents found');
    });
  });
});

describe('schema', () => {
  it('should accept empty file', () => {
    expect(schema.validate({}).error).toBeUndefined();
  });

  it('should accept empty events', () => {
    expect(
      schema.validate({
        state_events: [],
        room_events: [],
      }).error
    ).toBeUndefined();
  });

  it('should accept events', () => {
    expect(
      schema.validate({
        state_events: [
          {
            type: 'm.example',
            content: { data: 'value' },
            additional: 'tmp',
          },
          {
            type: 'm.example',
            state_key: 'a',
            content: { data: 'value' },
            additional: 'tmp',
          },
          {
            type: 'im.vector.modular.widgets',
            state_key: 'widget-1',
            content: {
              type: 'm.custom',
              url: 'https://some_url',
              name: 'Widget',
            },
          },
          {
            type: 'im.vector.modular.widgets',
            state_key: 'widget-1',
            optional: true,
            content: {
              type: 'm.custom',
              url: 'https://some_url',
              name: 'Widget',
              avatar_url: 'mxc://url',
              data: { a: 'b' },
            },
          },
          {
            type: 'im.vector.modular.widgets',
            state_key: 'widget-1',
            optional: false,
            content: {
              type: 'm.custom',
              url: 'https://some_url',
              name: 'Widget',
              avatar_url: './url',
            },
          },
        ],
        room_events: [
          {
            type: 'm.room.message',
            content: { msgtype: 'm.text', body: 'My message' },
          },
        ],
      }).error
    ).toBeUndefined();
  });

  it('should accept additional properties', () => {
    expect(
      schema.validate({
        state_events: [
          {
            type: 'm.example',
            content: { data: 'value' },
            additional: 'tmp',
          },
          {
            type: 'im.vector.modular.widgets',
            state_key: 'widget-1',
            content: {
              type: 'm.custom',
              url: 'https://some_url',
              name: 'Widget',
              additional: 'tmp',
            },
            additional: 'tmp',
          },
        ],
        room_events: [
          {
            type: 'm.room.message',
            content: { msgtype: 'm.text', body: 'My message' },
            additional: 'tmp',
          },
        ],
        additional: 'tmp',
      }).error
    ).toBeUndefined();
  });

  it.each<Object>([
    { state_events: null },
    { state_events: 'text' },
    { state_events: [{ type: undefined, content: {} }] },
    { state_events: [{ type: null, content: {} }] },
    { state_events: [{ type: 111, content: {} }] },
    {
      state_events: [
        {
          type: 'im.vector.modular.widgets',
          state_key: undefined,
          content: { type: 'i', url: 'i', name: 'n' },
        },
      ],
    },
    { state_events: [{ type: 't', state_key: null, content: {} }] },
    { state_events: [{ type: 't', state_key: 111, content: {} }] },
    { state_events: [{ type: 't', content: undefined }] },
    { state_events: [{ type: 't', content: null }] },
    { state_events: [{ type: 't', content: 111 }] },
    { state_events: [{ type: 't', content: undefined }] },
    {
      state_events: [
        {
          type: 'im.vector.modular.widgets',
          state_key: 'k',
          optional: null,
          content: { type: 'i', url: 'i', name: 'n' },
        },
      ],
    },
    {
      state_events: [
        {
          type: 'im.vector.modular.widgets',
          state_key: 'k',
          optional: 111,
          content: { type: 'i', url: 'i', name: 'n' },
        },
      ],
    },
    { room_events: null },
    { room_events: 'text' },
    { room_events: [{ type: undefined, content: {} }] },
    { room_events: [{ type: null, content: {} }] },
    { room_events: [{ type: 111, content: {} }] },
    { room_events: [{ type: 't', content: undefined }] },
    { room_events: [{ type: 't', content: null }] },
    { room_events: [{ type: 't', content: 111 }] },
  ])('should reject file with patch %j', (patch: Object) => {
    expect(
      schema.validate({
        ...patch,
      }).error
    ).toBeDefined();
  });

  it.each<Object>([
    { type: undefined },
    { type: null },
    { type: 111 },
    { type: '' },
    { url: undefined },
    { url: null },
    { url: 111 },
    { url: '' },
    { name: undefined },
    { name: null },
    { name: 111 },
    { name: '' },
    { avatar_url: null },
    { avatar_url: 111 },
    { avatar_url: '' },
    { avatar_url: 'http://example.com/image.png' },
    { data: null },
    { data: 111 },
  ])('should reject widget event content with patch %p', (patch: Object) => {
    expect(
      schema.validate({
        state_events: [
          {
            type: 'im.vector.modular.widgets',
            state_key: 'widget-1',
            content: { type: 'i', url: 'i', name: 'n', ...patch },
          },
        ],
      }).error
    ).toBeDefined();
  });
});
