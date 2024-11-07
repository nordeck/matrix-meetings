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
import { waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acknowledgeAllEvents,
  mockCalendar,
  mockNordeckMeetingMetadataEvent,
  mockPowerLevelsEvent,
  mockRoomCreate,
  mockRoomMember,
  mockRoomName,
  mockRoomTombstone,
  mockRoomTopic,
  mockSpaceChild,
  mockSpaceParent,
  mockWidgetEvent,
} from '../../lib/testUtils';
import { isBotUser as isBotUserMocked } from '../../lib/utils';
import { createStore } from '../../store';
import { withEventContext } from './helpers';
import {
  initializeMeetingsApi,
  makeSelectAllRoomMemberEventsByRoomId,
  makeSelectAllRoomParentEventsByParentRoomId,
  makeSelectAllRoomWidgetEventsByRoomId,
  meetingsApi,
} from './meetingsApi';
import {
  CreateBreakoutSessionsOptions,
  CreateMeetingOptions,
  UpdateMeetingDetailsOptions,
  UpdateMeetingPermissionsOptions,
} from './types';

vi.mock('../../lib/utils', async () => ({
  ...(await vi.importActual<typeof import('../../lib/utils')>(
    '../../lib/utils',
  )),
  isBotUser: vi.fn(),
}));
const isBotUser = vi.mocked(isBotUserMocked);

let widgetApi: MockedWidgetApi;
afterEach(() => widgetApi.stop());
beforeEach(() => (widgetApi = mockWidgetApi()));

describe('meetingsApi', () => {
  describe('createMeeting', () => {
    const { initiate } = meetingsApi.endpoints.createMeeting;

    const opts: CreateMeetingOptions = {
      meeting: {
        title: 'My Meeting',
        description: 'My description',
        calendar: mockCalendar({
          dtstart: '20200101T000000',
          dtend: '20200101T010000',
        }),
        participants: ['@user1:matrix'],
        widgetIds: ['widget1'],
      },
    };

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents('net.nordeck.meetings.meeting.create')
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate(opts))).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.meeting.create',
            content: withEventContext(widgetApi, {
              title: 'My Meeting',
              description: 'My description',
              calendar: [
                {
                  uid: 'entry-0',
                  dtstart: { tzid: 'UTC', value: '20200101T000000' },
                  dtend: { tzid: 'UTC', value: '20200101T010000' },
                },
              ],
              participants: [{ user_id: '@user1:matrix' }],
              widget_ids: ['widget1'],
            }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(await dispatch(initiate(opts))).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('createBreakoutSessions', () => {
    const { initiate } = meetingsApi.endpoints.createBreakoutSessions;

    const opts: CreateBreakoutSessionsOptions = {
      breakoutSessions: {
        groups: [
          {
            title: 'My Meeting',
            participants: ['@user1:matrix'],
          },
        ],
        description: 'My description',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
        widgetIds: ['widget1'],
      },
    };

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents('net.nordeck.meetings.breakoutsessions.create')
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate(opts))).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.breakoutsessions.create',
            content: withEventContext(widgetApi, {
              groups: [
                {
                  title: 'My Meeting',
                  participants: [{ user_id: '@user1:matrix' }],
                },
              ],
              description: 'My description',
              start_time: '2020-01-01T00:00:00Z',
              end_time: '2020-01-01T01:00:00Z',
              widget_ids: ['widget1'],
            }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(await dispatch(initiate(opts))).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('closeMeeting', () => {
    const { initiate } = meetingsApi.endpoints.closeMeeting;

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents('net.nordeck.meetings.meeting.close')
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate({ roomId: '!roomId' }))).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.meeting.close',
            content: withEventContext(widgetApi, { target_room_id: '!roomId' }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(await dispatch(initiate({ roomId: '!roomId' }))).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('sendMessageToBreakoutSessions', () => {
    const { initiate } = meetingsApi.endpoints.sendMessageToBreakoutSessions;

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents('net.nordeck.meetings.sub_meetings.send_message')
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(
        await dispatch(
          initiate({
            parentRoomId: '!roomId',
            message: 'Hi!',
          }),
        ),
      ).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.sub_meetings.send_message',
            content: withEventContext(widgetApi, {
              target_room_id: '!roomId',
              message: 'Hi!',
            }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(
        await dispatch(
          initiate({
            parentRoomId: '!roomId',
            message: 'Hi!',
          }),
        ),
      ).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('updateMeetingWidgets', () => {
    const { initiate } = meetingsApi.endpoints.updateMeetingWidgets;

    it('should add and remove widgets event', async () => {
      let eventIdx = 0;

      widgetApi
        .observeRoomEvents('net.nordeck.meetings.meeting.widgets.handle')
        .subscribe((event) => {
          if (eventIdx++ === 0) {
            return acknowledgeAllEvents(widgetApi)(event);
          } else {
            return acknowledgeAllEvents(widgetApi, { key: '❌' })(event);
          }
        });

      const { dispatch } = createStore({ widgetApi });

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
            addWidgets: ['widget-1'],
            removeWidgets: ['widget-2'],
          }),
        ),
      ).toEqual({
        data: {
          acknowledgements: [
            { success: true },
            {
              error: true,
              errorRoomId: undefined,
            },
          ],
          events: [
            expect.objectContaining({
              type: 'net.nordeck.meetings.meeting.widgets.handle',
              content: withEventContext(widgetApi, {
                target_room_id: '!roomId',
                add: true,
                widget_ids: ['widget-1'],
              }),
            }),
            expect.objectContaining({
              type: 'net.nordeck.meetings.meeting.widgets.handle',
              content: withEventContext(widgetApi, {
                target_room_id: '!roomId',
                add: false,
                widget_ids: ['widget-2'],
              }),
            }),
          ],
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(2);
    });

    it('should ignore empty request', async () => {
      const { dispatch } = createStore({ widgetApi });

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
          }),
        ),
      ).toEqual({
        data: {
          acknowledgements: [],
          events: [],
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(0);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
            addWidgets: ['widget-1'],
          }),
        ),
      ).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('updateMeetingParticipants', () => {
    const { initiate } = meetingsApi.endpoints.updateMeetingParticipants;

    it('should add and remove widgets event', async () => {
      let eventIdx = 0;

      widgetApi
        .observeRoomEvents('net.nordeck.meetings.meeting.participants.handle')
        .subscribe((event) => {
          if (eventIdx++ === 0) {
            return acknowledgeAllEvents(widgetApi)(event);
          } else {
            return acknowledgeAllEvents(widgetApi, { key: '❌' })(event);
          }
        });

      const { dispatch } = createStore({ widgetApi });

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
            addUserIds: ['@user-1:matrix'],
            removeUserIds: ['@user-2:matrix'],
          }),
        ),
      ).toEqual({
        data: {
          acknowledgements: [
            { success: true },
            {
              error: true,
              errorRoomId: undefined,
            },
          ],
          events: [
            expect.objectContaining({
              type: 'net.nordeck.meetings.meeting.participants.handle',

              content: withEventContext(widgetApi, {
                target_room_id: '!roomId',
                invite: true,
                userIds: ['@user-1:matrix'],
              }),
            }),
            expect.objectContaining({
              type: 'net.nordeck.meetings.meeting.participants.handle',

              content: withEventContext(widgetApi, {
                target_room_id: '!roomId',
                invite: false,
                userIds: ['@user-2:matrix'],
              }),
            }),
          ],
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(2);
    });

    it('should ignore empty request', async () => {
      const { dispatch } = createStore({ widgetApi });

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
          }),
        ),
      ).toEqual({
        data: {
          acknowledgements: [],
          events: [],
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(0);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(
        await dispatch(
          initiate({
            roomId: '!roomId',
            addUserIds: ['@user-1:matrix'],
          }),
        ),
      ).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('updateMeetingDetails', () => {
    const { initiate } = meetingsApi.endpoints.updateMeetingDetails;

    const opts: UpdateMeetingDetailsOptions = {
      roomId: '!roomId',
      updates: {
        title: 'My Meeting',
        description: 'My description',
        calendar: mockCalendar({
          dtstart: '20200101T000000',
          dtend: '20200101T010000',
        }),
      },
    };

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents('net.nordeck.meetings.meeting.update')
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate(opts))).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.meeting.update',
            content: withEventContext(widgetApi, {
              target_room_id: '!roomId',
              title: 'My Meeting',
              description: 'My description',
              calendar: [
                {
                  uid: 'entry-0',
                  dtstart: { tzid: 'UTC', value: '20200101T000000' },
                  dtend: { tzid: 'UTC', value: '20200101T010000' },
                },
              ],
            }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    // TODO: should skip if no changes in the update object

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(await dispatch(initiate(opts))).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('updateMeetingPermissions', () => {
    const { initiate } = meetingsApi.endpoints.updateMeetingPermissions;

    const opts: UpdateMeetingPermissionsOptions = {
      roomId: '!roomId',
      powerLevels: {
        messaging: 50,
      },
    };

    it('should emit event', async () => {
      widgetApi
        .observeRoomEvents(
          'net.nordeck.meetings.meeting.change.message_permissions',
        )
        .subscribe(acknowledgeAllEvents(widgetApi));

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate(opts))).toEqual({
        data: {
          acknowledgement: { success: true },
          event: expect.objectContaining({
            type: 'net.nordeck.meetings.meeting.change.message_permissions',
            content: withEventContext(widgetApi, {
              target_room_id: '!roomId',
              messaging_power_level: 50,
            }),
          }),
        },
      });

      expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    });

    it('should handle error', async () => {
      const { dispatch } = createStore({ widgetApi });

      widgetApi.sendRoomEvent.mockRejectedValue(new Error('invalid'));

      expect(await dispatch(initiate(opts))).toEqual({
        error: expect.objectContaining({ message: 'invalid' }),
      });
    });
  });

  describe('getRoomChildEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomChildEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(
        mockSpaceChild({ room_id: '!parent-room' }),
      );

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [`${event.room_id}_${event.state_key}`]: event,
            },
            ids: [expect.stringContaining(event.room_id)],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(
        mockSpaceChild({ room_id: '!parent-room' }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [`${event.room_id}_${event.state_key}`]: event,
              },
              ids: [expect.stringContaining(event.room_id)],
            },
          }),
        );
      });
    });

    it('should remove event', async () => {
      widgetApi.mockSendStateEvent(mockSpaceChild({ room_id: '!parent-room' }));

      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      widgetApi.mockSendStateEvent(
        mockSpaceChild({
          room_id: '!parent-room',
          content: { via: undefined },
        }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {},
              ids: [],
            },
          }),
        );
      });
    });
  });

  describe('getRoomParentEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomParentEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(
        mockSpaceParent({ room_id: '!roomId1' }),
      );

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
            },
            ids: [event.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(
        mockSpaceParent({ room_id: '!roomId1' }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
              },
              ids: [event.room_id],
            },
          }),
        );
      });
    });

    it('should remove event', async () => {
      widgetApi.mockSendStateEvent(mockSpaceParent({ room_id: '!roomId1' }));

      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      widgetApi.mockSendStateEvent(
        mockSpaceParent({ room_id: '!roomId1', content: { via: undefined } }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {},
              ids: [],
            },
          }),
        );
      });
    });
  });

  describe('getRoomCreateEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomCreateEvents;

    it('should load events', async () => {
      const events = [
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId1',
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId2',
            content: {
              type: 'net.nordeck.meetings.breakoutsession',
            },
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId3',
            content: { type: undefined },
          }),
        ),
      ];

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [events[0].room_id]: events[0],
              [events[1].room_id]: events[1],
              [events[2].room_id]: events[2],
            },
            ids: [events[0].room_id, events[1].room_id, events[2].room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const events = [
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId1',
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId2',
            content: {
              type: 'net.nordeck.meetings.breakoutsession',
            },
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomCreate({
            room_id: '!roomId3',
            content: { type: undefined },
          }),
        ),
      ];

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [events[0].room_id]: events[0],
                [events[1].room_id]: events[1],
                [events[2].room_id]: events[2],
              },
              ids: [events[0].room_id, events[1].room_id, events[2].room_id],
            },
          }),
        );
      });
    });
  });

  describe('getRoomTombstoneEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomTombstoneEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(mockRoomTombstone());

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
            },
            ids: [event.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(mockRoomTombstone());

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
              },
              ids: [event.room_id],
            },
          }),
        );
      });
    });
  });

  describe('getRoomNameEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomNameEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(mockRoomName());

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
            },
            ids: [event.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(mockRoomName());

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
              },
              ids: [event.room_id],
            },
          }),
        );
      });
    });
  });

  describe('getRoomPowerLevelsEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomPowerLevelsEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
            },
            ids: [event.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
              },
              ids: [event.room_id],
            },
          }),
        );
      });
    });
  });

  describe('getRoomTopicEvents', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomTopicEvents;

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(mockRoomTopic());

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
            },
            ids: [event.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(mockRoomTopic());

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
              },
              ids: [event.room_id],
            },
          }),
        );
      });
    });
  });

  describe('getNordeckMeetingMetadataEvents', () => {
    const { initiate, select } =
      meetingsApi.endpoints.getNordeckMeetingMetadataEvents;

    const legacyEvent = mockNordeckMeetingMetadataEvent({
      room_id: '!legacy-room-id',
      content: { calendar: undefined },
    });
    legacyEvent.content.start_time = '2020-01-01T10:00:00Z';
    legacyEvent.content.end_time = '2020-01-01T10:00:00Z';

    const convertedLegacyEvent = mockNordeckMeetingMetadataEvent({
      room_id: '!legacy-room-id',
      content: {
        calendar: [
          {
            uid: expect.any(String),
            dtstart: { tzid: 'UTC', value: '20200101T100000' },
            dtend: { tzid: 'UTC', value: '20200101T100000' },
          },
        ],
      },
    });

    it('should load events', async () => {
      const event = widgetApi.mockSendStateEvent(
        mockNordeckMeetingMetadataEvent(),
      );
      widgetApi.mockSendStateEvent(legacyEvent);

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [event.room_id]: event,
              [legacyEvent.room_id]: convertedLegacyEvent,
            },
            ids: [event.room_id, legacyEvent.room_id],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const event = widgetApi.mockSendStateEvent(
        mockNordeckMeetingMetadataEvent(),
      );
      widgetApi.mockSendStateEvent(legacyEvent);

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [event.room_id]: event,
                [legacyEvent.room_id]: convertedLegacyEvent,
              },
              ids: [event.room_id, legacyEvent.room_id],
            },
          }),
        );
      });
    });
  });

  describe('getRoomMembers', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomMembers;

    it('should load events', async () => {
      const events = [
        widgetApi.mockSendStateEvent(
          mockRoomMember({
            state_key: '@user1:matrix',
            content: { membership: 'join' },
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomMember({
            state_key: '@user2:matrix',
            content: { membership: 'invite' },
          }),
        ),
      ];

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [`${events[0].room_id}_${events[0].state_key}`]: events[0],
              [`${events[1].room_id}_${events[1].state_key}`]: events[1],
            },
            ids: [
              expect.stringContaining(events[0].room_id),
              expect.stringContaining(events[1].room_id),
            ],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const events = [
        widgetApi.mockSendStateEvent(
          mockRoomMember({
            state_key: '@user1:matrix',
            content: { membership: 'join' },
          }),
        ),
        widgetApi.mockSendStateEvent(
          mockRoomMember({
            state_key: '@user2:matrix',
            content: { membership: 'invite' },
          }),
        ),
      ];

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [`${events[0].room_id}_${events[0].state_key}`]: events[0],
                [`${events[1].room_id}_${events[1].state_key}`]: events[1],
              },
              ids: [
                expect.stringContaining(events[0].room_id),
                expect.stringContaining(events[1].room_id),
              ],
            },
          }),
        );
      });
    });

    it('should remove event', async () => {
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user1:matrix',
          content: { membership: 'join' },
        }),
      );

      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user1:matrix',
          content: { membership: 'leave' },
        }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {},
              ids: [],
            },
          }),
        );
      });
    });

    it('should ignore the bot user', async () => {
      const botUser = widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user1:matrix',
          content: { membership: 'join' },
        }),
      );

      isBotUser.mockImplementation((id) => id === botUser.state_key);

      const { dispatch, getState } = createStore({ widgetApi });

      const subscription = dispatch(initiate());

      expect(await subscription).toEqual(
        expect.objectContaining({
          data: {
            entities: {},
            ids: [],
          },
        }),
      );

      const event = widgetApi.mockSendStateEvent(
        mockRoomMember({
          state_key: '@user2:matrix',
          content: { membership: 'invite' },
        }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [`${event.room_id}_${event.state_key}`]: event,
              },
              ids: [expect.stringContaining(event.room_id)],
            },
          }),
        );
      });
    });
  });

  describe('getRoomWidgets', () => {
    const { initiate, select } = meetingsApi.endpoints.getRoomWidgets;

    it('should load events', async () => {
      const events = [widgetApi.mockSendStateEvent(mockWidgetEvent())];

      const { dispatch } = createStore({ widgetApi });

      expect(await dispatch(initiate())).toEqual(
        expect.objectContaining({
          data: {
            entities: {
              [`${events[0].room_id}_${events[0].state_key}`]: events[0],
            },
            ids: [expect.stringContaining(events[0].room_id)],
          },
        }),
      );
    });

    it('should observe events', async () => {
      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      const events = [widgetApi.mockSendStateEvent(mockWidgetEvent())];

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {
                [`${events[0].room_id}_${events[0].state_key}`]: events[0],
              },
              ids: [expect.stringContaining(events[0].room_id)],
            },
          }),
        );
      });
    });

    it('should remove event', async () => {
      widgetApi.mockSendStateEvent(mockWidgetEvent());

      const { dispatch, getState } = createStore({ widgetApi });

      dispatch(initiate());

      widgetApi.mockSendStateEvent(
        mockWidgetEvent({ content: { type: undefined, url: undefined } }),
      );

      await waitFor(() => {
        expect(select()(getState())).toEqual(
          expect.objectContaining({
            data: {
              entities: {},
              ids: [],
            },
          }),
        );
      });
    });
  });
});

describe('selectAllRoomParentEventsByParentRoomId', () => {
  const selectAllRoomParentEventsByParentRoomId =
    makeSelectAllRoomParentEventsByParentRoomId();

  it('should return all room parent events', async () => {
    const events = [
      widgetApi.mockSendStateEvent(
        mockSpaceParent({
          room_id: '!roomId1',
          state_key: '!roomId1',
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockSpaceParent({
          room_id: '!roomId2',
          state_key: '!roomId1',
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockSpaceParent({
          room_id: '!roomId3',
          state_key: '!roomId2',
        }),
      ),
    ];

    const { dispatch, getState } = createStore({ widgetApi });

    await initializeMeetingsApi(dispatch);

    expect(
      selectAllRoomParentEventsByParentRoomId(getState(), '!roomId1'),
    ).toEqual([events[0], events[1]]);
    expect(
      selectAllRoomParentEventsByParentRoomId(getState(), '!roomId2'),
    ).toEqual([events[2]]);
  });
});

describe('selectAllRoomMemberEventsByRoomId', () => {
  const selectAllRoomMemberEventsByRoomId =
    makeSelectAllRoomMemberEventsByRoomId();

  it('should return all room members', async () => {
    const events = [
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          room_id: '!roomId1',
          state_key: '@user1:matrix',
          content: { membership: 'join' },
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          room_id: '!roomId1',
          state_key: '@user2:matrix',
          content: { membership: 'invite' },
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockRoomMember({
          room_id: '!roomId2',
          state_key: '@user3:matrix',
          content: { membership: 'invite' },
        }),
      ),
    ];

    const { dispatch, getState } = createStore({ widgetApi });

    await initializeMeetingsApi(dispatch);

    expect(selectAllRoomMemberEventsByRoomId(getState(), '!roomId1')).toEqual([
      events[0],
      events[1],
    ]);
    expect(selectAllRoomMemberEventsByRoomId(getState(), '!roomId2')).toEqual([
      events[2],
    ]);
  });
});

describe('selectAllRoomWidgetEventsByRoomId', () => {
  const selectAllRoomWidgetEventsByRoomId =
    makeSelectAllRoomWidgetEventsByRoomId();

  it('should return all room members', async () => {
    const events = [
      widgetApi.mockSendStateEvent(
        mockWidgetEvent({
          room_id: '!roomId1',
          state_key: 'widget-1',
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockWidgetEvent({
          room_id: '!roomId1',
          state_key: 'widget-2',
        }),
      ),
      widgetApi.mockSendStateEvent(
        mockWidgetEvent({
          room_id: '!roomId2',
          state_key: 'widget-3',
        }),
      ),
    ];

    const { dispatch, getState } = createStore({ widgetApi });

    await initializeMeetingsApi(dispatch);

    expect(selectAllRoomWidgetEventsByRoomId(getState(), '!roomId1')).toEqual([
      events[0],
      events[1],
    ]);
    expect(selectAllRoomWidgetEventsByRoomId(getState(), '!roomId2')).toEqual([
      events[2],
    ]);
  });
});
