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
import { RootState, createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { makeSelectRoomType } from './selectRoomType';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('selectRoomType', () => {
  let state: RootState;

  beforeEach(async () => {
    widgetApi.mockSendStateEvent(
      mockRoomCreate({ room_id: '!no-meeting', content: { type: undefined } }),
    );
    mockCreateMeetingRoom(widgetApi, { room_id: '!meeting' });
    mockCreateBreakoutMeetingRoom(widgetApi, { room_id: '!breakout' });

    const store = createStore({ widgetApi });
    await initializeStore(store);
    state = store.getState();
  });

  it.each`
    roomId           | result
    ${'!no-room'}    | ${'management'}
    ${'!no-meeting'} | ${'management'}
    ${'!meeting'}    | ${'meeting'}
    ${'!breakout'}   | ${'breakout'}
  `('should handle $roomId', ({ roomId, result }) => {
    const selectRoomType = makeSelectRoomType();

    expect(selectRoomType(state, roomId)).toBe(result);
  });
});
