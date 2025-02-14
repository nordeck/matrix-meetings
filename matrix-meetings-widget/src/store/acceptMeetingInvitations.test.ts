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

import { MockedWidgetApi, mockWidgetApi } from '../lib/mockWidgetApi';
import {
  mockCreateMeetingRoom,
  mockNordeckMeetingMetadataEvent,
  mockRoomCreate,
  mockRoomMember,
  mockSpaceParent,
} from '../lib/testUtils';
import { acceptMeetingInvitations } from './acceptMeetingInvitations';
import { createStore, initializeStore } from './store';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('acceptMeetingInvitations', () => {
  beforeEach(() => {
    mockCreateMeetingRoom(widgetApi);

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!meeting-room-id',
        content: { membership: 'invite' },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockSpaceParent({ room_id: '!meeting-room-id' }),
    );
  });

  it('should accept invitations', async () => {
    const acceptedMeetingIds = new Set<string>();

    const store = createStore({ widgetApi });
    await initializeStore(store);

    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    // the second call shouldn't update it again
    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.member',
      {
        displayname: 'Alice',
        membership: 'join',
        avatar_url: expect.any(String),
      },
      { stateKey: '@user-id', roomId: '!meeting-room-id' },
    );
  });

  it('should accept invitations of a breakout session', async () => {
    const acceptedMeetingIds = new Set<string>();

    const store = createStore({ widgetApi });
    await initializeStore(store);

    widgetApi.mockSendStateEvent(
      mockRoomCreate({
        content: {
          type: 'net.nordeck.meetings.breakoutsession',
        },
      }),
    );

    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.member',
      {
        displayname: 'Alice',
        membership: 'join',
        avatar_url: expect.any(String),
      },
      { stateKey: '@user-id', roomId: '!meeting-room-id' },
    );
  });

  it('should not join if the meeting was created by another user', async () => {
    const acceptedMeetingIds = new Set<string>();

    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({
        content: { creator: '@another-user' },
      }),
    );

    const store = createStore({ widgetApi });
    await initializeStore(store);

    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(0);
  });

  it('should not join if the meeting is a child of another room', async () => {
    const acceptedMeetingIds = new Set<string>();

    widgetApi.mockSendStateEvent(
      mockSpaceParent({
        room_id: '!meeting-room-id',
        state_key: widgetApi.widgetParameters.roomId,
        content: { via: [] },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockSpaceParent({
        room_id: '!meeting-room-id',
        state_key: '!anotherRoomId',
        content: { via: ['matrix.to'] },
      }),
    );

    const store = createStore({ widgetApi });
    await initializeStore(store);

    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(0);
  });

  it('should retry failed update', async () => {
    const acceptedMeetingIds = new Set<string>();

    const store = createStore({ widgetApi });
    await initializeStore(store);

    widgetApi.sendStateEvent.mockRejectedValueOnce(new Error());

    // this call fails internally
    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    // this call will update it
    await expect(
      acceptMeetingInvitations({
        state: store.getState(),
        userId: '@user-id',
        widgetApi,
        acceptedMeetingIds,
      }),
    ).resolves.toBeUndefined();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(2);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.member',
      {
        displayname: 'Alice',
        membership: 'join',
        avatar_url: expect.any(String),
      },
      { stateKey: '@user-id', roomId: '!meeting-room-id' },
    );
  });
});
