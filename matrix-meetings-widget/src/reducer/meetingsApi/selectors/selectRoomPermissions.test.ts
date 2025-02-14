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
  hasActionPower as hasActionPowerMocked,
  hasRoomEventPower as hasRoomEventPowerMocked,
  hasStateEventPower as hasStateEventPowerMocked,
  PowerLevelsStateEvent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { MockedWidgetApi, mockWidgetApi } from '../../../lib/mockWidgetApi';
import { mockPowerLevelsEvent } from '../../../lib/testUtils';
import { createStore, RootState } from '../../../store';
import { initializeStore } from '../../../store/store';
import {
  hasPermissions,
  makeSelectRoomPermissions,
} from './selectRoomPermissions';

jest.mock('@matrix-widget-toolkit/api', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/api'),
  hasActionPower: jest.fn(),
  hasRoomEventPower: jest.fn(),
  hasStateEventPower: jest.fn(),
}));

const hasActionPower = jest.mocked(hasActionPowerMocked);
const hasRoomEventPower = jest.mocked(hasRoomEventPowerMocked);
const hasStateEventPower = jest.mocked(hasStateEventPowerMocked);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('hasPermissions', () => {
  const event = { content: {} } as StateEvent<PowerLevelsStateEvent>;

  it('should allow', () => {
    hasRoomEventPower.mockReturnValue(true);
    hasStateEventPower.mockReturnValue(true);
    hasActionPower.mockReturnValue(true);

    expect(
      hasPermissions(event, '@user', {
        roomEventTypes: ['room-1', 'room-2'],
        stateEventTypes: ['state-1', 'state-2'],
        actions: ['invite'],
      }),
    ).toBe(true);

    expect(hasRoomEventPower).toBeCalledWith({}, '@user', 'room-1');
    expect(hasRoomEventPower).toBeCalledWith({}, '@user', 'room-2');
    expect(hasStateEventPower).toBeCalledWith({}, '@user', 'state-1');
    expect(hasStateEventPower).toBeCalledWith({}, '@user', 'state-2');
    expect(hasActionPower).toBeCalledWith({}, '@user', 'invite');
  });

  it('should reject on room event', () => {
    hasRoomEventPower.mockReturnValue(false);

    expect(
      hasPermissions(event, '@user', {
        roomEventTypes: ['room-1', 'room-2'],
        stateEventTypes: ['state-1', 'state-2'],
        actions: ['invite'],
      }),
    ).toBe(false);

    expect(hasRoomEventPower).toBeCalledTimes(1);
    expect(hasRoomEventPower).toBeCalledWith({}, '@user', 'room-1');
    expect(hasStateEventPower).not.toBeCalled();
    expect(hasActionPower).not.toBeCalled();
  });

  it('should reject on state event', async () => {
    hasStateEventPower.mockReturnValue(false);

    expect(
      hasPermissions(event, '@user', {
        stateEventTypes: ['state-1', 'state-2'],
        actions: ['invite'],
      }),
    ).toBe(false);

    expect(hasRoomEventPower).not.toBeCalled();
    expect(hasStateEventPower).toBeCalledTimes(1);
    expect(hasStateEventPower).toBeCalledWith({}, '@user', 'state-1');
    expect(hasActionPower).not.toBeCalled();
  });

  it('should reject on action', async () => {
    hasActionPower.mockReturnValue(false);

    expect(
      hasPermissions(event, '@user', {
        actions: ['invite', 'kick'],
      }),
    ).toBe(false);

    expect(hasRoomEventPower).not.toBeCalled();
    expect(hasStateEventPower).not.toBeCalled();
    expect(hasActionPower).toBeCalledTimes(1);
    expect(hasActionPower).toBeCalledWith({}, '@user', 'invite');
  });
});

describe('selectRoomPermissions', () => {
  let state: RootState;

  beforeEach(async () => {
    // restore mocks
    const orig = jest.requireActual('@matrix-widget-toolkit/api');
    hasRoomEventPower.mockImplementation(orig.hasRoomEventPower);
    hasStateEventPower.mockImplementation(orig.hasStateEventPower);
    hasActionPower.mockImplementation(orig.hasActionPower);

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!allowed',
        content: {
          users: {
            '@my-user': 20,
          },
          users_default: 0,
          events: {
            'net.nordeck.meetings.meeting.create': 20,
            'net.nordeck.meetings.breakoutsessions.create': 20,
            'net.nordeck.meetings.meeting.close': 20,
            'net.nordeck.meetings.meeting.widgets.handle': 20,
            'net.nordeck.meetings.meeting.participants.handle': 20,
            'net.nordeck.meetings.meeting.update': 20,
            'net.nordeck.meetings.meeting.change.message_permissions': 20,
            'net.nordeck.meetings.sub_meetings.send_message': 20,
            'm.room.message': 20,
            'm.room.name': 20,
            'm.room.topic': 20,
            'net.nordeck.meetings.metadata': 20,
            'im.vector.modular.widgets': 20,
            'io.element.widgets.layout': 20,
            'm.room.power_levels': 20,
            'm.room.tombstone': 20,
          },
          kick: 20,
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id: '!rejected',
        content: {
          users_default: 0,
          events_default: 100,
        },
      }),
    );

    const store = createStore({ widgetApi });
    await initializeStore(store);
    state = store.getState();
  });

  it('should permit all', () => {
    const selectRoomPermissions = makeSelectRoomPermissions();

    expect(selectRoomPermissions(state, '!allowed', '@my-user')).toEqual({
      canCloseMeeting: true,
      canCreateMeeting: true,
      canCreateBreakoutSessions: true,
      canUpdateMeetingDetails: true,
      canUpdateMeetingParticipantsInvite: true,
      canUpdateMeetingParticipantsKick: true,
      canUpdateMeetingPermissions: true,
      canUpdateMeetingWidgets: true,
      canSendMessageToAllBreakoutSessions: true,
    });
  });

  it('should reject all', () => {
    const selectRoomPermissions = makeSelectRoomPermissions();

    expect(selectRoomPermissions(state, '!rejected', '@my-user')).toEqual({
      canCloseMeeting: false,
      canCreateMeeting: false,
      canCreateBreakoutSessions: false,
      canUpdateMeetingDetails: false,
      canUpdateMeetingParticipantsInvite: false,
      canUpdateMeetingParticipantsKick: false,
      canUpdateMeetingPermissions: false,
      canUpdateMeetingWidgets: false,
      canSendMessageToAllBreakoutSessions: false,
    });
  });
});
