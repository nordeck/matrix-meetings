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
  PowerLevelsStateEvent,
  RoomEvent,
  RoomMemberStateEventContent,
  StateEvent,
  StateEventCreateContent,
} from '@matrix-widget-toolkit/api';
import { MockedWidgetApi } from '@matrix-widget-toolkit/testing';
import {
  formatICalDate,
  mockCalendar,
} from '@nordeck/matrix-meetings-calendar';
import { rest } from 'msw';
import { SetupServer } from 'msw/node';
import { AvailableWidget } from '../reducer/meetingBotApi';
import { Meeting } from '../reducer/meetingsApi';
import {
  NordeckMeetingMetadataEvent,
  ReactionEvent,
  RoomNameEvent,
  RoomTombstoneEvent,
  RoomTopicEvent,
  SpaceChildEvent,
  SpaceParentEvent,
  WidgetsEvent,
} from './matrix';

/**
 * Create a matrix room member event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomMember({
  state_key = '@user-id:example.com',
  event_id = '$event-id-0',
  room_id = '!room-id:example.com',
  sender = '@inviter-id:example.com',
  content = {},
}: {
  state_key?: string;
  event_id?: string;
  room_id?: string;
  sender?: string;
  content?: Partial<RoomMemberStateEventContent>;
} = {}): StateEvent<RoomMemberStateEventContent> {
  return {
    type: 'm.room.member',
    sender,
    content: {
      membership: 'join',
      displayname: 'Alice',
      avatar_url: 'mxc://alice.png',
      ...content,
    },
    state_key,
    origin_server_ts: 0,
    event_id,
    room_id,
  };
}

/**
 * Create a matrix power levels event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPowerLevelsEvent({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<PowerLevelsStateEvent>;
} = {}): StateEvent<PowerLevelsStateEvent> {
  return {
    type: 'm.room.power_levels',
    sender: '@bot:example.com',
    content: {
      users_default: 0,
      ...content,
    },
    state_key: '',
    origin_server_ts: 0,
    event_id: '$event-id-0',
    room_id,
  };
}

/**
 * Create a room create event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomCreate({
  room_id = '!room-id:example.com',
  room_version = '10',
  content = {},
}: {
  room_id?: string;
  room_version?: string;
  content?: Partial<StateEventCreateContent>;
} = {}): StateEvent<StateEventCreateContent> {
  return {
    type: 'm.room.create',
    sender: '@bot:example.com',
    state_key: '',
    content: {
      room_version,
      type: 'net.nordeck.meetings.meeting',
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room name event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomName({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomNameEvent>;
} = {}): StateEvent<RoomNameEvent> {
  return {
    type: 'm.room.name',
    sender: '@bot:example.com',
    state_key: '',
    content: {
      name: 'An important meeting',
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a meeting metadata event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockNordeckMeetingMetadataEvent({
  room_id = '!meeting-room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<
    Omit<NordeckMeetingMetadataEvent, 'start_time' | 'end_time'>
  >;
} = {}): StateEvent<NordeckMeetingMetadataEvent> {
  return {
    type: 'net.nordeck.meetings.metadata',
    sender: '@bot:example.com',
    state_key: '',
    content: {
      creator: '@user-id:example.com',
      calendar: mockCalendar({
        dtstart: '29990101T100000',
        dtend: '29990101T140000',
      }),
      external_data: {},
      force_deletion_at: undefined,
      auto_deletion_offset: undefined,
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room topic event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomTopic({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomTopicEvent>;
} = {}): StateEvent<RoomTopicEvent> {
  return {
    type: 'm.room.topic',
    sender: '@bot:example.com',
    state_key: '',
    content: {
      topic: 'A brief description',
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room tombstone event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomTombstone({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomTombstoneEvent>;
} = {}): StateEvent<RoomTombstoneEvent> {
  return {
    type: 'm.room.tombstone',
    sender: '@bot:example.com',
    state_key: '',
    content: {
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a reaction event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockReaction({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<ReactionEvent>;
} = {}): RoomEvent<ReactionEvent> {
  return {
    type: 'm.reaction',
    sender: '@bot:example.com',
    content: {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: '$event-id',
        key: '✅',
      },
      'net.nordeck.meetings.bot.meta': {
        room_id: undefined,
      },
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a space parent event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockSpaceParent({
  room_id,
  state_key = '!room-id:example.com',
  content = {},
}: {
  room_id: string;
  state_key?: string;
  content?: Partial<SpaceParentEvent>;
}): StateEvent<SpaceParentEvent> {
  return {
    type: 'm.space.parent',
    sender: '@bot:example.com',
    state_key,
    content: {
      via: ['matrix.to'],
      ...content,
    },
    room_id,
    event_id: '$event-id',
    origin_server_ts: 0,
  };
}

/**
 * Create a space child event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockSpaceChild({
  room_id,
  state_key = '!room-id:example.com',
  content = {},
}: {
  room_id: string;
  state_key?: string;
  content?: Partial<SpaceChildEvent>;
}): StateEvent<SpaceChildEvent> {
  return {
    type: 'm.space.child',
    sender: '@bot:example.com',
    state_key,
    content: {
      via: ['matrix.to'],
      ...content,
    },
    room_id,
    event_id: '$event-id:example.com',
    origin_server_ts: 0,
  };
}

/**
 * Create a widget event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockWidgetEvent({
  room_id = '!room-id:example.com',
  state_key = 'widget-0',
  content = {},
}: {
  room_id?: string;
  state_key?: string;
  content?: Partial<WidgetsEvent>;
} = {}): StateEvent<WidgetsEvent> {
  return {
    type: 'im.vector.modular.widgets',
    sender: '@bot:example.com',
    state_key,
    content: {
      type: 'm.custom',
      url: 'https://unknown',
      ...content,
    },
    room_id,
    event_id: '$event-id',
    origin_server_ts: 0,
  };
}

export function mockWidgetEndpoint(
  server: SetupServer,
  { widgets }: { widgets?: AvailableWidget[] } = {},
) {
  server.use(
    rest.get('http://localhost/v1/widget/list', (_, res, ctx) =>
      res(
        ctx.json(
          widgets ?? [
            {
              id: 'widget-1',
              name: 'Widget 1',
            },
            {
              id: 'widget-2',
              name: 'Widget 2',
            },
          ],
        ),
      ),
    ),
  );
}

export function mockConfigEndpoint(
  server: SetupServer,
  {
    jitsiDialInEnabled,
    openXchangeMeetingUrlTemplate,
  }: {
    jitsiDialInEnabled?: boolean;
    openXchangeMeetingUrlTemplate?: string;
  } = {},
) {
  server.use(
    rest.get('http://localhost/v1/config', (_, res, ctx) =>
      res(ctx.json({ jitsiDialInEnabled, openXchangeMeetingUrlTemplate })),
    ),
  );
}

export function mockMeetingSharingInformationEndpoint(
  server: SetupServer,
  {
    jitsi_dial_in_number,
    jitsi_pin,
  }: { jitsi_dial_in_number?: string; jitsi_pin?: number } = {},
) {
  server.use(
    rest.get(
      'http://localhost/v1/meeting/:room/sharingInformation',
      (_, res, ctx) => res(ctx.json({ jitsi_dial_in_number, jitsi_pin })),
    ),
  );
}

/**
 * Send an acknowledge for the events.
 *
 *  Usage: {@code widgetApi.observeRoomEvents('...').subscribe(acknowledgeAllEvents(widgetApi))}
 *
 * @remarks Only use for tests
 */
export function acknowledgeAllEvents(
  widgetApi: MockedWidgetApi,
  opts?: { key?: string },
) {
  return (event: RoomEvent<unknown>) => {
    widgetApi.mockSendRoomEvent(
      mockReaction({
        room_id: event.room_id,
        content: {
          'm.relates_to': {
            rel_type: 'm.annotation',
            event_id: event.event_id,
            key: opts?.key ?? '✅',
          },
        },
      }),
    );
  };
}

/**
 * Create a meeting room with known test data.
 *
 * @remarks Only use for tests
 */
export function mockCreateMeetingRoom(
  widgetApi: MockedWidgetApi,
  {
    room_id = '!meeting-room-id:example.com',
    room_version = '10',
    parentRoomId = '!room-id:example.com',
    metadata,
    name,
    powerLevelsEventContent = {
      users: {
        '@user-id:example.com': 100,
      },
    },
    roomOptions,
  }: {
    room_id?: string;
    room_version?: string;
    parentRoomId?: string;
    metadata?: Partial<
      Omit<NordeckMeetingMetadataEvent, 'start_time' | 'end_time'>
    >;
    name?: Partial<RoomNameEvent>;
    powerLevelsEventContent?: PowerLevelsStateEvent;
    roomOptions?: {
      skipParentEvent?: boolean;
      skipCreateEvent?: boolean;
      skipPowerLevelsEvent?: boolean;
      skipNameEvent?: boolean;
      skipTopicEvent?: boolean;
      skipMetadataEvent?: boolean;
      skipRoomMemberEvents?: boolean;
      withTombstoneEvent?: boolean;
      withWidgetEvents?: boolean;
    };
  } = {},
) {
  if (!roomOptions?.skipCreateEvent) {
    widgetApi.mockSendStateEvent(mockRoomCreate({ room_id, room_version }));
  }

  if (!roomOptions?.skipPowerLevelsEvent) {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        room_id,
        content: powerLevelsEventContent,
      }),
    );
  }

  if (!roomOptions?.skipNameEvent) {
    widgetApi.mockSendStateEvent(mockRoomName({ room_id, content: name }));
  }

  if (!roomOptions?.skipMetadataEvent) {
    widgetApi.mockSendStateEvent(
      mockNordeckMeetingMetadataEvent({ room_id, content: metadata }),
    );
  }

  if (!roomOptions?.skipTopicEvent) {
    widgetApi.mockSendStateEvent(mockRoomTopic({ room_id }));
  }

  if (!roomOptions?.skipRoomMemberEvents) {
    widgetApi.mockSendStateEvent(mockRoomMember({ room_id }));
  }

  if (!roomOptions?.skipParentEvent) {
    widgetApi.mockSendStateEvent(
      mockSpaceParent({ room_id, state_key: parentRoomId }),
    );
  }

  if (roomOptions?.withTombstoneEvent) {
    widgetApi.mockSendStateEvent(mockRoomTombstone({ room_id }));
  }

  if (roomOptions?.withWidgetEvents) {
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({ room_id, state_key: 'widget-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockWidgetEvent({ room_id, state_key: 'widget-2' }),
    );
  }
}

/**
 * Create a meeting room with known test data.
 *
 * @remarks Only use for tests
 */
export function mockCreateBreakoutMeetingRoom(
  widgetApi: MockedWidgetApi,
  {
    room_id = '!breakout-room-id:example.com',
    meeting_room_id = '!meeting-room-id:example.com',
    metadata,
    name,
  }: {
    room_id?: string;
    meeting_room_id?: string;
    metadata?: Partial<
      Omit<NordeckMeetingMetadataEvent, 'start_time' | 'end_time'>
    >;
    name?: Partial<RoomNameEvent>;
  } = {},
) {
  widgetApi.mockSendStateEvent(
    mockRoomCreate({
      room_id,
      content: { type: 'net.nordeck.meetings.breakoutsession' },
    }),
  );
  widgetApi.mockSendStateEvent(mockRoomName({ room_id, content: name }));
  widgetApi.mockSendStateEvent(
    mockNordeckMeetingMetadataEvent({ room_id, content: metadata }),
  );
  widgetApi.mockSendStateEvent(mockRoomTopic({ room_id }));
  widgetApi.mockSendStateEvent(mockRoomMember({ room_id }));
  widgetApi.mockSendStateEvent(
    mockSpaceParent({ room_id, state_key: meeting_room_id }),
  );
}

/**
 * Create a meeting invitation with known test data.
 *
 * @remarks Only use for tests
 */
export function mockCreateMeetingInvitation(
  widgetApi: MockedWidgetApi,
  {
    room_id = '!meeting-room-id:example.com',
    create,
    roomOptions,
  }: {
    room_id?: string;
    create?: Partial<StateEventCreateContent>;
    roomOptions?: {
      skipCreateEvent?: boolean;
      skipNameEvent?: boolean;
      skipTopicEvent?: boolean;
      skipRoomMemberEvents?: boolean;
    };
  } = {},
) {
  if (!roomOptions?.skipCreateEvent) {
    widgetApi.mockSendStateEvent(mockRoomCreate({ room_id, content: create }));
  }

  if (!roomOptions?.skipNameEvent) {
    widgetApi.mockSendStateEvent(mockRoomName({ room_id }));
  }

  if (!roomOptions?.skipTopicEvent) {
    widgetApi.mockSendStateEvent(mockRoomTopic({ room_id }));
  }

  if (!roomOptions?.skipRoomMemberEvents) {
    widgetApi.mockSendStateEvent(
      mockRoomMember({ room_id, content: { membership: 'invite' } }),
    );
  }
}

/**
 * Return known test data as returned by a `selectMeeting()` selector.
 *
 * @remarks Only use for tests
 */
export function mockMeeting({
  room_id = '!meeting-room-id:example.com',
  parentRoomId,
  content = {},
}: {
  room_id?: string;
  parentRoomId?: string;
  content?: Partial<Meeting>;
} = {}): Meeting {
  const calendarUid = content.calendarUid ?? 'entry-0';
  const startTime = content.startTime ?? '2999-01-01T10:00:00Z';
  const endTime = content.endTime ?? '2999-01-01T14:00:00Z';
  const calendarEntries =
    content.calendarEntries ??
    mockCalendar({
      uid: calendarUid,
      dtstart: formatICalDate(new Date(startTime)).value,
      dtend: formatICalDate(new Date(endTime)).value,
    });

  return {
    type: 'net.nordeck.meetings.meeting',
    title: 'An important meeting',
    description: 'A brief description',
    startTime,
    endTime,
    meetingId: room_id,
    calendarUid,
    participants: [
      {
        userId: '@user-id:example.com',
        displayName: 'Alice',
        membership: 'join',
        rawEvent: mockRoomMember({ room_id }),
      },
    ],
    widgets: [],
    deletionTime: undefined,
    parentRoomId,
    creator: '@user-id:example.com',
    calendarEntries,
    recurrenceId: calendarEntries[0].rrule ? startTime : undefined,
    ...content,
  };
}

/**
 * Return known test data as returned by a `selectMeeting()` selector for a
 * breakout session.
 *
 * @remarks Only use for tests
 */
export function mockBreakoutSession({
  room_id = '!breakout-room-id:example.com',
  parentRoomId = '!meeting-room-id:example.com',
  content = {},
}): Meeting {
  return mockMeeting({
    room_id,
    parentRoomId,
    content: {
      type: 'net.nordeck.meetings.breakoutsession',
      ...content,
    },
  });
}

export {
  mockCalendar,
  mockCalendarEntry,
} from '@nordeck/matrix-meetings-calendar';
