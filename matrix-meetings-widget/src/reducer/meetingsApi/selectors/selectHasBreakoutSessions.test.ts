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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mockCreateBreakoutMeetingRoom,
  mockCreateMeetingRoom,
  mockRoomCreate,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { makeSelectHasBreakoutSessions } from './selectHasBreakoutSessions';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('selectHasBreakoutSessions', () => {
  const selectHasBreakoutSessions = makeSelectHasBreakoutSessions();

  it('should return true', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi, {
      meeting_room_id: '!meeting-room-id',
      room_id: '!breakout-room-id',
    });

    const store = createStore({ widgetApi });
    await initializeStore(store);
    const state = store.getState();

    expect(selectHasBreakoutSessions(state, '!meeting-room-id')).toBe(true);
  });

  it('should return false if invalid children type', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi, {
      meeting_room_id: '!meeting-room-id',
      room_id: '!breakout-room-id',
    });

    widgetApi.mockSendStateEvent(
      mockRoomCreate({
        room_id: '!breakout-room-id',
        content: { type: undefined },
      }),
    );

    const store = createStore({ widgetApi });
    await initializeStore(store);
    const state = store.getState();

    expect(selectHasBreakoutSessions(state, '!meeting-room-id')).toBe(false);
  });

  it('should return false if no meeting room', async () => {
    mockCreateMeetingRoom(widgetApi);
    mockCreateBreakoutMeetingRoom(widgetApi, {
      meeting_room_id: '!meeting-room-id',
      room_id: '!breakout-room-id',
    });

    widgetApi.mockSendStateEvent(
      mockRoomCreate({
        room_id: '!meeting-room-id',
        content: { type: undefined },
      }),
    );

    const store = createStore({ widgetApi });
    await initializeStore(store);
    const state = store.getState();

    expect(selectHasBreakoutSessions(state, '!meeting-room-id')).toBe(false);
  });
});
