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
} from '@matrix-widget-toolkit/api';
import { MockedWidgetApi } from '@matrix-widget-toolkit/testing';
import {
  CalendarEntry,
  formatICalDate,
} from '@nordeck/matrix-meetings-calendar';
import { rest } from 'msw';
import { SetupServer } from 'msw/node';
import { AvailableWidget } from '../reducer/meetingBotApi';
import { Meeting } from '../reducer/meetingsApi';
import {
  NordeckMeetingMetadataEvent,
  ReactionEvent,
  RoomCreateEvent,
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
  state_key = '@user-id',
  event_id = '$event-id-0',
  room_id = '!room-id',
  sender = '@inviter-id',
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<PowerLevelsStateEvent>;
} = {}): StateEvent<PowerLevelsStateEvent> {
  return {
    type: 'm.room.power_levels',
    sender: '@user-id',
    content: {
      users_default: 100,
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomCreateEvent>;
} = {}): StateEvent<RoomCreateEvent> {
  return {
    type: 'm.room.create',
    sender: '@user-id',
    state_key: '',
    content: {
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomNameEvent>;
} = {}): StateEvent<RoomNameEvent> {
  return {
    type: 'm.room.name',
    sender: '@user-id',
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
 * Create a calendar entry with a single entry that starts at the given times.
 *
 * @param dtstart - the start time in the iCalendar format in UTC
 * @param dtend - the start time in the iCalendar format in UTC
 *
 * @remarks Only use for tests
 */
export function mockCalendar({
  uid = 'entry-0',
  dtstart,
  dtend,
  rrule,
  exdate,
  recurrenceId,
}: {
  uid?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
  exdate?: string[];
  recurrenceId?: string;
}): CalendarEntry[] {
  return [
    mockCalendarEntry({ uid, dtstart, dtend, rrule, exdate, recurrenceId }),
  ];
}

/**
 * Create a calendar entry that starts at the given times.
 *
 * @param dtstart - the start time in the iCalendar format in UTC
 * @param dtend - the start time in the iCalendar format in UTC
 *
 * @remarks Only use for tests
 */
export function mockCalendarEntry({
  uid = 'entry-0',
  dtstart,
  dtend,
  rrule,
  exdate,
  recurrenceId,
}: {
  uid?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
  exdate?: string[];
  recurrenceId?: string;
}): CalendarEntry {
  return {
    uid,
    dtstart: { tzid: 'UTC', value: dtstart },
    dtend: { tzid: 'UTC', value: dtend },
    rrule,
    exdate: exdate?.map((value) => ({ tzid: 'UTC', value })),
    recurrenceId:
      recurrenceId !== undefined
        ? { tzid: 'UTC', value: recurrenceId }
        : undefined,
  };
}

/**
 * Create a meeting metadata event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockNordeckMeetingMetadataEvent({
  room_id = '!meeting-room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<
    Omit<NordeckMeetingMetadataEvent, 'start_time' | 'end_time'>
  >;
} = {}): StateEvent<NordeckMeetingMetadataEvent> {
  return {
    type: 'net.nordeck.meetings.metadata',
    sender: '@user-id',
    state_key: '',
    content: {
      creator: '@user-id',
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomTopicEvent>;
} = {}): StateEvent<RoomTopicEvent> {
  return {
    type: 'm.room.topic',
    sender: '@user-id',
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomTombstoneEvent>;
} = {}): StateEvent<RoomTombstoneEvent> {
  return {
    type: 'm.room.tombstone',
    sender: '@user-id',
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
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<ReactionEvent>;
} = {}): RoomEvent<ReactionEvent> {
  return {
    type: 'm.reaction',
    sender: '@user-id',
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
  state_key = '!room-id',
  content = {},
}: {
  room_id: string;
  state_key?: string;
  content?: Partial<SpaceParentEvent>;
}): StateEvent<SpaceParentEvent> {
  return {
    type: 'm.space.parent',
    sender: '@user-id',
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
  state_key = '!room-id',
  content = {},
}: {
  room_id: string;
  state_key?: string;
  content?: Partial<SpaceChildEvent>;
}): StateEvent<SpaceChildEvent> {
  return {
    type: 'm.space.child',
    sender: '@user-id',
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
 * Create a widget event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockWidgetEvent({
  room_id = '!room-id',
  state_key = 'widget-0',
  content = {},
}: {
  room_id?: string;
  state_key?: string;
  content?: Partial<WidgetsEvent>;
} = {}): StateEvent<WidgetsEvent> {
  return {
    type: 'im.vector.modular.widgets',
    sender: '@user-id',
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
    room_id = '!meeting-room-id',
    parentRoomId = '!room-id',
    metadata,
    name,
    roomOptions,
  }: {
    room_id?: string;
    parentRoomId?: string;
    metadata?: Partial<
      Omit<NordeckMeetingMetadataEvent, 'start_time' | 'end_time'>
    >;
    name?: Partial<RoomNameEvent>;
    roomOptions?: {
      skipParentEvent?: boolean;
      skipCreateEvent?: boolean;
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
    widgetApi.mockSendStateEvent(mockRoomCreate({ room_id }));
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
    room_id = '!breakout-room-id',
    meeting_room_id = '!meeting-room-id',
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
    room_id = '!meeting-room-id',
    create,
    roomOptions,
  }: {
    room_id?: string;
    create?: Partial<RoomCreateEvent>;
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
  room_id = '!meeting-room-id',
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
        userId: '@user-id',
        displayName: 'Alice',
        membership: 'join',
        rawEvent: mockRoomMember({ room_id }),
      },
    ],
    widgets: [],
    deletionTime: undefined,
    parentRoomId,
    creator: '@user-id',
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
  room_id = '!breakout-room-id',
  parentRoomId = '!meeting-room-id',
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
