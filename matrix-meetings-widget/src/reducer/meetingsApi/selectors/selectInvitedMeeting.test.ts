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

import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import {
  mockCreateMeetingInvitation,
  mockRoomCreate,
  mockSpaceChild,
} from '../../../lib/testUtils';
import { RootState, createStore } from '../../../store';
import { initializeStore } from '../../../store/store';
import { makeSelectInvitedMeeting } from './selectInvitedMeeting';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

async function generateRootState(): Promise<RootState> {
  const store = createStore({ widgetApi });
  await initializeStore(store);
  return store.getState();
}

describe('selectInvitedMeeting', () => {
  const selectInvitedMeeting = makeSelectInvitedMeeting();

  it('should generate meeting', async () => {
    mockCreateMeetingInvitation(widgetApi);

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      title: 'An important meeting',
      description: 'A brief description',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'invite',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      parentRoomId: undefined,
    });
  });

  it('should generate breakout meeting', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      create: { type: 'net.nordeck.meetings.breakoutsession' },
    });

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toEqual({
      type: 'net.nordeck.meetings.breakoutsession',
      meetingId: '!meeting-room-id',
      title: 'An important meeting',
      description: 'A brief description',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'invite',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
    });
  });

  it('should generate meeting with parent', async () => {
    mockCreateMeetingInvitation(widgetApi);

    widgetApi.mockSendStateEvent(mockRoomCreate({ room_id: '!parentRoomId' }));
    widgetApi.mockSendStateEvent(
      mockSpaceChild({
        room_id: '!parentRoomId',
        state_key: '!meeting-room-id',
      }),
    );

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      title: 'An important meeting',
      description: 'A brief description',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'invite',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      parentRoomId: '!parentRoomId',
    });
  });

  it('should generate meeting with space parent', async () => {
    mockCreateMeetingInvitation(widgetApi);

    widgetApi.mockSendStateEvent(
      mockRoomCreate({
        room_id: '!parentRoomId',
        content: { type: 'm.space' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockSpaceChild({
        room_id: '!parentRoomId',
        state_key: '!meeting-room-id',
      }),
    );

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      title: 'An important meeting',
      description: 'A brief description',
      participants: [
        {
          userId: '@user-id',
          displayName: 'Alice',
          membership: 'invite',
          rawEvent: expect.objectContaining({
            state_key: '@user-id',
          }),
        },
      ],
      parentRoomId: undefined,
    });
  });

  it('should generate meeting without participants and description', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      roomOptions: {
        skipTopicEvent: true,
        skipRoomMemberEvents: true,
      },
    });

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toEqual({
      type: 'net.nordeck.meetings.meeting',
      meetingId: '!meeting-room-id',
      title: 'An important meeting',
      description: undefined,
      participants: [],
      parentRoomId: undefined,
    });
  });

  it('should ignore meeting without create event', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      roomOptions: { skipCreateEvent: true },
    });

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toBeUndefined();
  });

  it('should ignore meeting without name', async () => {
    mockCreateMeetingInvitation(widgetApi, {
      roomOptions: { skipNameEvent: true },
    });

    const state = await generateRootState();

    expect(selectInvitedMeeting(state, '!meeting-room-id')).toBeUndefined();
  });
});
