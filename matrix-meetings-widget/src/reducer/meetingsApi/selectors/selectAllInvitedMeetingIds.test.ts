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
  mockCreateMeetingInvitation,
  mockCreateMeetingRoom,
  mockRoomCreate,
  mockRoomMember,
  mockRoomName,
  mockSpaceChild,
} from '../../../lib/testUtils';
import { RootState, createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { selectRoomNameEventEntities } from '../meetingsApi';
import {
  makeSelectAllInvitedMeetingIds,
  sortMeetings,
} from './selectAllInvitedMeetingIds';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

async function generateRootState(): Promise<RootState> {
  const store = createStore({ widgetApi });
  await initializeStore(store);
  return store.getState();
}

describe('selectAllInvitedMeetingIds', () => {
  describe('default opts', () => {
    const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds();

    it('should generate meeting', async () => {
      // this is a room with a partial state that is only invited
      mockCreateMeetingInvitation(widgetApi);
      // this is a room with a correct meeting that should be skipped
      mockCreateMeetingRoom(widgetApi, { room_id: '!other-room-id' });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should ignore breakout session', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        create: { type: 'net.nordeck.meetings.breakoutsession' },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });

    it('should generate meeting with child', async () => {
      mockCreateMeetingInvitation(widgetApi);

      widgetApi.mockSendStateEvent(
        mockRoomCreate({ room_id: '!parentRoomId' }),
      );
      widgetApi.mockSendStateEvent(
        mockSpaceChild({
          room_id: '!parentRoomId',
          state_key: '!meeting-room-id',
        }),
      );

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should generate meeting without description', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        roomOptions: { skipTopicEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should ignore meeting without create event', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        roomOptions: { skipCreateEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });

    it('should ignore meeting without name', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        roomOptions: { skipNameEvent: true },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });
  });

  describe('opts = { isChildOfRoomId: "defined" }', () => {
    const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
      isChildOfRoomId: '!parentRoomId',
    });

    it('should include meeting with parent', async () => {
      mockCreateMeetingInvitation(widgetApi);

      widgetApi.mockSendStateEvent(
        mockRoomCreate({ room_id: '!parentRoomId' }),
      );
      widgetApi.mockSendStateEvent(
        mockSpaceChild({
          room_id: '!parentRoomId',
          state_key: '!meeting-room-id',
        }),
      );

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should include meeting without parent', async () => {
      mockCreateMeetingInvitation(widgetApi);

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should include meeting with another space parent', async () => {
      mockCreateMeetingInvitation(widgetApi);

      widgetApi.mockSendStateEvent(
        mockRoomCreate({
          room_id: '!another-room-id',
          content: { type: 'm.space' },
        }),
      );
      widgetApi.mockSendStateEvent(
        mockSpaceChild({
          room_id: '!another-room-id',
          state_key: '!meeting-room-id',
        }),
      );

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should ignore meeting with different parent', async () => {
      mockCreateMeetingInvitation(widgetApi);

      widgetApi.mockSendStateEvent(
        mockRoomCreate({
          room_id: '!another-room-id',
        }),
      );
      widgetApi.mockSendStateEvent(
        mockSpaceChild({
          room_id: '!another-room-id',
          state_key: '!meeting-room-id',
        }),
      );

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });
  });

  describe('opts = { includeBreakoutSessions: true, skipMeetings: true }', () => {
    const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
      includeBreakoutSessions: true,
      skipMeetings: true,
    });

    it('should generate breakout meeting', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        create: { type: 'net.nordeck.meetings.breakoutsession' },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should ignore meeting', async () => {
      mockCreateMeetingInvitation(widgetApi);

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });
  });

  describe('opts = { includeBreakoutSessions: true }', () => {
    const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
      includeBreakoutSessions: true,
    });

    it('should generate meeting', async () => {
      mockCreateMeetingInvitation(widgetApi);

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should generate breakout meeting', async () => {
      mockCreateMeetingInvitation(widgetApi, {
        create: { type: 'net.nordeck.meetings.breakoutsession' },
      });

      const state = await generateRootState();

      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });
  });

  describe('opts = { hasMemberId: "defined" }', () => {
    it('should generate meeting if invited', async () => {
      mockCreateMeetingInvitation(widgetApi);

      const state = await generateRootState();

      const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
        hasMemberId: '@user-id',
      });
      expect(selectAllInvitedMeetingIds(state)).toEqual(['!meeting-room-id']);
    });

    it('should skip meeting if joined', async () => {
      mockCreateMeetingInvitation(widgetApi);
      widgetApi.mockSendStateEvent(
        mockRoomMember({ room_id: '!meeting-room-id' }),
      );

      const state = await generateRootState();

      const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
        hasMemberId: '@user-id',
      });

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });

    it('should skip meeting if not invited', async () => {
      mockCreateMeetingInvitation(widgetApi);

      const state = await generateRootState();

      const selectAllInvitedMeetingIds = makeSelectAllInvitedMeetingIds({
        hasMemberId: '@another-user:matrix',
      });

      expect(selectAllInvitedMeetingIds(state)).toEqual([]);
    });
  });
});

describe('sortMeetings', () => {
  it('should work', () => {
    const roomIds = ['!roomId1', '!roomId2', '!roomId3'];

    const roomNameEvents: ReturnType<typeof selectRoomNameEventEntities> = {
      '!roomId1': mockRoomName({
        room_id: '!roomId1',
        content: { name: 'Meeting 2' },
      }),
      '!roomId2': mockRoomName({
        room_id: '!roomId2',
        content: { name: 'Meeting 1' },
      }),
      '!roomId3': mockRoomName({
        room_id: '!roomId3',
        content: { name: 'Meeting 3' },
      }),
    };

    sortMeetings(roomIds, { roomNameEvents });

    expect(roomIds).toEqual(['!roomId2', '!roomId1', '!roomId3']);
  });
});
