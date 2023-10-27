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

import fetch from 'jest-fetch-mock';
import _, { last } from 'lodash';
import {
  MatrixClient,
  PowerLevelsEventContent,
  RoomTopicEventContent,
} from 'matrix-bot-sdk';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import {
  anything,
  capture,
  deepEqual,
  instance,
  mock,
  resetCalls,
  verify,
  when,
} from 'ts-mockito';
import { EventContentRenderer } from '../src/EventContentRenderer';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { MatrixEndpoint } from '../src/MatrixEndpoint';
import { JitsiClient } from '../src/client/JitsiClient';
import { MeetingClient } from '../src/client/MeetingClient';
import { WidgetClient } from '../src/client/WidgetClient';
import { BreakoutSessionsDetailDto } from '../src/dto/BreakoutSessionsDetailDto';
import { BreakoutSessionsDto } from '../src/dto/BreakoutSessionsDto';
import { MeetingChangeMessagingPermissionDto } from '../src/dto/MeetingChangeMessagingPermissionDto';
import { MeetingCloseDto } from '../src/dto/MeetingCloseDto';
import { MeetingCreateDto } from '../src/dto/MeetingCreateDto';
import { MeetingCreateResponseDto } from '../src/dto/MeetingCreateResponseDto';
import { MeetingParticipantsHandleDto } from '../src/dto/MeetingParticipantsHandleDto';
import { MeetingSharingInformationDto } from '../src/dto/MeetingSharingInformationDto';
import { MeetingUpdateDetailsDto } from '../src/dto/MeetingUpdateDetailsDto';
import { MeetingWidgetsHandleDto } from '../src/dto/MeetingWidgetsHandleDto';
import { ParticipantDto } from '../src/dto/ParticipantDto';
import { SubMeetingsSendMessageDto } from '../src/dto/SubMeetingsSendMessageDto';
import { PermissionError } from '../src/error/PermissionError';
import { RoomNotCreatedError } from '../src/error/RoomNotCreatedError';
import { RoomMatrixEventsReader } from '../src/io/RoomMatrixEventsReader';
import { WidgetLayoutConfigReader } from '../src/io/WidgetLayoutConfigReader';
import { IRoomCreate } from '../src/matrix/dto/IRoomCreate';
import {
  IStateEvent,
  iStateEventHelper,
} from '../src/matrix/event/IStateEvent';
import { ExternalData } from '../src/model/ExternalData';
import { IElementMembershipEventContent } from '../src/model/IElementMembershipEventContent';
import { IMeetingsMetadataEventContent } from '../src/model/IMeetingsMetadataEventContent';
import { IRoomMatrixEvents } from '../src/model/IRoomMatrixEvents';
import { IUserContext } from '../src/model/IUserContext';
import { MeetingCloseMethod } from '../src/model/MeetingCloseMethod';
import { MeetingType } from '../src/model/MeetingType';
import { powerLevelHelper } from '../src/model/PowerLevelHelper';
import { Room } from '../src/model/Room';
import { RoomEventName } from '../src/model/RoomEventName';
import { RoomMatrixEventsHelper } from '../src/model/RoomMatrixEventsHelper';
import { StateEventName } from '../src/model/StateEventName';
import { WidgetType } from '../src/model/WidgetType';
import { MeetingService } from '../src/service/MeetingService';
import { RoomMessageService } from '../src/service/RoomMessageService';
import { WidgetLayoutService } from '../src/service/WidgetLayoutService';
import { create_test_meeting } from './MeetingServiceTestRooms';
import { RoomEventsBuilder } from './RoomEventsBuilder';
import {
  SendStateEventParameter,
  captureSendStateEvent,
  createAppConfig,
  getArgsFromCaptor,
} from './util/MockUtils';

describe('test relevant functionality of MeetingService', () => {
  let eventContentRenderer: EventContentRenderer;
  let widgetService: WidgetClient;
  let meetingClient: MeetingClient;
  let jitsiClientMock: JitsiClient;
  let meetingService: MeetingService;

  let appConfig: IAppConfiguration;

  const clientMock: MatrixClient = mock(MatrixClient);
  const client: MatrixClient = instance(clientMock);
  const MAIN_NON_MEETING_ROOM_ID = 'MAIN_NON_MEETING_ROOM_ID';
  const PARENT_MEETING_ROOM_ID = 'PARENT_MEETING_ROOM_ID';
  const MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID =
    'MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID';
  const MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID =
    'MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID';

  const ROOM_ID = 'ROOM_ID';
  const BOT_USER = '@botUserId:matrix.org';
  const CURRENT_USER = 'userWhoIsSending';
  const TITLE = 'testTitle';
  const TOPIC = 'testTopic';
  const START = '2020-11-11T14:07:21.488Z';
  const END = '2022-11-11T14:07:21.488Z';
  const userContext: IUserContext = {
    locale: 'en-US',
    timezone: 'UTC',
    userId: CURRENT_USER,
  };
  const createEvent = (parentRoomId: string | undefined): MeetingCreateDto =>
    new MeetingCreateDto(
      parentRoomId,
      TITLE,
      TOPIC,
      START,
      END,
      undefined,
      undefined,
      [],
      0,
      true,
      undefined,
    );

  const roomMatrixEvents: IRoomMatrixEvents = new RoomMatrixEventsReader(
    'test/conf/test_default_events.json',
  ).read();

  const getInitialStatesAsMap = (roomProps: any) => {
    const map: any = {};
    for (let i = 0; i < roomProps.initial_state.length; i++) {
      map[(roomProps.initial_state[i] as any).type] =
        roomProps.initial_state[i];
    }
    return map;
  };

  const layoutConfigs = new WidgetLayoutConfigReader(
    'test/conf/test_default_widget_layouts.json.json',
  ).read();

  const stateEventStub: Omit<IStateEvent<any>, 'type' | 'content'> = {
    event_id: '',
    origin_server_ts: 0,
    prev_content: {},
    sender: '',
    state_key: '',
  };

  const initRoomsAndFetchResult = () => {
    let parentRoom: IStateEvent<any>[] = create_test_meeting(
      CURRENT_USER,
      PARENT_MEETING_ROOM_ID,
      null,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings', 'poll'],
    );
    const mainRoom: any[] = create_test_meeting(
      CURRENT_USER,
      MAIN_NON_MEETING_ROOM_ID,
      null,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings', 'poll'],
      false,
    );
    const childRoom1: IStateEvent<any>[] = create_test_meeting(
      CURRENT_USER,
      'childRoom1',
      PARENT_MEETING_ROOM_ID,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings', 'poll'],
    );
    const childRoom2: IStateEvent<any>[] = create_test_meeting(
      CURRENT_USER,
      'childRoom2',
      PARENT_MEETING_ROOM_ID,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings', 'poll'],
    );
    const room: any[] = create_test_meeting(
      CURRENT_USER,
      ROOM_ID,
      PARENT_MEETING_ROOM_ID,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings', 'poll'],
    );
    const meetingRoomWithoutWidgetsUnderMeetingRoom: any[] =
      create_test_meeting(
        CURRENT_USER,
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID,
        PARENT_MEETING_ROOM_ID,
        [],
      );
    const meetingRoomWithoutWidgetsUnderNonMeetingRoom: any[] =
      create_test_meeting(
        CURRENT_USER,
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID,
        MAIN_NON_MEETING_ROOM_ID,
        [],
      );
    const i1: any[] = create_test_meeting(CURRENT_USER, 'i1', null);
    const i2: any[] = create_test_meeting(CURRENT_USER, 'i2', null);

    parentRoom.push(
      iStateEventHelper.fromPartial({
        type: StateEventName.M_SPACE_CHILD_EVENT,
        state_key: 'childRoom1',
        content: {
          via: ['localhost'],
        },
      }),
    );
    parentRoom = parentRoom.map((se) => {
      if (se.type === StateEventName.M_ROOM_POWER_LEVELS_EVENT) {
        const content = se.content as PowerLevelsEventContent;
        const newSe: IStateEvent<PowerLevelsEventContent> = {
          ...se,
          content: {
            ...content,
            users: {
              ...content.users,
              '@admin_user:localhost': 100,
            },
          },
        };
        return newSe;
      } else {
        return se;
      }
    });
    parentRoom.push(
      iStateEventHelper.fromPartial({
        type: StateEventName.M_SPACE_CHILD_EVENT,
        state_key: 'childRoom2',
        content: {
          via: ['localhost'],
        },
      }),
    );

    const fetchResult: any = {
      rooms: {
        join: {},
      },
    };
    fetchResult.rooms.join['childRoom1'] = {
      state: {
        events: childRoom1,
      },
    };
    fetchResult.rooms.join['childRoom2'] = {
      state: {
        events: childRoom2,
      },
    };
    when(
      clientMock.doRequest(
        'GET',
        MatrixEndpoint.MATRIX_CLIENT_SYNC,
        anything(),
        anything(),
        anything(),
        anything(),
        anything(),
        anything(),
      ),
    ).thenResolve(fetchResult);
    when(
      clientMock.doRequest(
        'GET',
        MatrixEndpoint.MATRIX_CLIENT_SYNC,
        anything(),
      ),
    ).thenResolve(fetchResult);
    when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(
      parentRoom,
    ); // TODO load the room with configured json
    when(
      clientMock.getRoomState(
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID,
      ),
    ).thenResolve(meetingRoomWithoutWidgetsUnderMeetingRoom); // TODO load the room with configured json
    when(
      clientMock.getRoomState(
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID,
      ),
    ).thenResolve(meetingRoomWithoutWidgetsUnderNonMeetingRoom); // TODO load the room with configured json
    when(clientMock.getRoomState(MAIN_NON_MEETING_ROOM_ID)).thenResolve(
      mainRoom,
    ); // TODO load the room with configured json
    when(clientMock.getRoomState(ROOM_ID)).thenResolve(room); // TODO load the room with configured json
    when(clientMock.getRoomState('childRoom1')).thenResolve(childRoom1); // TODO load the room with configured json
    when(clientMock.getRoomState('childRoom2')).thenResolve(childRoom2); // TODO load the room with configured json
    when(clientMock.getRoomState('i1')).thenResolve(i1); // TODO load the room with configured json
    when(clientMock.getRoomState('i2')).thenResolve(i2); // TODO load the room with configured json

    const input: [string, IStateEvent<any>[]][] = [
      ['childRoom1', childRoom1],
      ['childRoom2', childRoom2],
    ];
    for (const [childRoomId, childRoom] of input) {
      for (const eventType of [
        StateEventName.M_ROOM_CREATION_EVENT,
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
        StateEventName.M_SPACE_PARENT_EVENT,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      ]) {
        const stateEvent = childRoom.find((se) => se.type === eventType);
        const eventContent = stateEvent?.content;
        when(
          clientMock.getRoomStateEvent(childRoomId, eventType, ''),
        ).thenResolve(eventContent);
      }
    }
  };

  const checkStandardFields = (
    roomProps: any,
    meetingType: MeetingType = MeetingType.MEETING,
    parentRoomId: string | null = PARENT_MEETING_ROOM_ID,
  ) => {
    expect(roomProps.name).toBe(TITLE);
    expect(roomProps.topic).toBe(TOPIC);
    expect(roomProps.visibility).toBe('private');
    expect(roomProps.preset).toBe('private_chat');
    expect(roomProps.creation_content.type).toBe(meetingType);

    const map = getInitialStatesAsMap(roomProps);

    expect(map[StateEventName.M_ROOM_HISTORY_VISIBILITY_EVENT]).toBeDefined();
    expect(map[StateEventName.NIC_MEETINGS_METADATA_EVENT]).toBeDefined();
    expect(map[StateEventName.M_ROOM_JOIN_RULES_EVENT]).toBeDefined();
    expect(map[StateEventName.M_ROOM_GUEST_ACCESS]).toBeDefined();

    const nic_meeting = map[StateEventName.NIC_MEETINGS_METADATA_EVENT];
    expect(nic_meeting.content.start_time).toBeUndefined();
    expect(nic_meeting.content.end_time).toBeUndefined();
    expect(nic_meeting.content.calendar[0]?.dtstart.value).toBe(
      '20201111T140721',
    );
    expect(nic_meeting.content.calendar[0]?.dtend.value).toBe(
      '20221111T140721',
    );
    expect(nic_meeting.content.locale).toBeUndefined();
    expect(nic_meeting.content.timezone).toBeUndefined();

    if (parentRoomId) {
      expect(map[StateEventName.M_SPACE_PARENT_EVENT].state_key).toBe(
        parentRoomId,
      );
    } else {
      expect(map[StateEventName.M_SPACE_PARENT_EVENT]).toBeUndefined();
    }

    const guest_access = map[StateEventName.M_ROOM_GUEST_ACCESS];
    expect(guest_access.content.guest_access).toBe('forbidden');

    if (!appConfig.auto_deletion_offset) {
      expect(nic_meeting.content.auto_deletion_offset).toBeUndefined();
    } else {
      expect(nic_meeting.content.force_deletion_at).toBeDefined();
    }

    expect(roomProps.power_level_content_override).toBeDefined();
  };

  beforeEach(() => {
    fetch.resetMocks();
    fetch.enableMocks();

    resetCalls(clientMock);

    appConfig = {
      ...createAppConfig(),
      matrix_link_share: 'https://matrix.to/#/',
    };
    eventContentRenderer = new EventContentRenderer(appConfig);
    widgetService = new WidgetClient(
      client,
      appConfig,
      eventContentRenderer,
      roomMatrixEvents,
    );
    meetingClient = new MeetingClient(client, eventContentRenderer);
    jitsiClientMock = mock(JitsiClient);
    meetingService = new MeetingService(
      instance(jitsiClientMock),
      client,
      new RoomMessageService(client, meetingClient),
      new MeetingClient(client, eventContentRenderer),
      appConfig,
      widgetService,
      roomMatrixEvents,
      eventContentRenderer,
      new WidgetLayoutService(layoutConfigs),
    );

    when(clientMock.getUserProfile(anything())).thenResolve({
      displayname: 'displayname',
    });
    when(clientMock.getUserId()).thenResolve(BOT_USER);
    appConfig.auto_deletion_offset = 5;

    when(clientMock.createRoom(anything())).thenResolve(ROOM_ID);
    initRoomsAndFetchResult();
  });

  test('userHasPowerlevel', async () => {
    const roomPowerlevelEvent = {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      content: {
        users: {
          peter: 100,
        },
        users_default: 0,
        events: {
          [StateEventName.NIC_MEETINGS_METADATA_EVENT]: 50,
          [StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT]: 101,
          Einhundert: 100,
        },
        events_default: 50,
        state_default: 50,
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 50,
      },
    };
    let events: any[] = [];
    events.push(roomPowerlevelEvent);

    let room = new Room('4711', events);

    roomPowerlevelEvent.content.users_default = 200;
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'unbekannt',
        StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      ),
    ).toBe(true);
    roomPowerlevelEvent.content.users_default = 50;

    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'unbekannt',
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
      ),
    ).toBe(true);
    roomPowerlevelEvent.content.users_default = 49;
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'unbekannt',
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
      ),
    ).toBe(false);

    roomPowerlevelEvent.content.users_default = -1;
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'unbekannt',
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
      ),
    ).toBe(false);

    events = [];
    events.push(roomPowerlevelEvent);

    room = new Room('asdfasdf', events);
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'unbekannt',
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
      ),
    ).toBe(false);

    const roomPowerlevelEvent3: any = {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      content: {
        state_default: 99,
        users_default: 75,
        events_default: 0,
        users: {},
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 50,
      },
    };
    roomPowerlevelEvent3.content.users['ooooo'] = 74;
    events = [];
    events.push(roomPowerlevelEvent3);
    room = new Room('asdfasdf', events);
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'ooooo',
        RoomEventName.M_ROOM_MESSAGE,
      ),
    ).toBe(true);
    expect(
      powerLevelHelper.userHasPowerLevelForAction(
        room,
        'ooooo',
        PowerLevelAction.Invite,
      ),
    ).toBe(true);
    expect(
      powerLevelHelper.userHasPowerLevelForAction(
        room,
        'ooooo',
        PowerLevelAction.Invite,
      ),
    ).toBe(true);
    roomPowerlevelEvent3.content.users['ooooo'] = -1;
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        'ooooo',
        RoomEventName.M_ROOM_MESSAGE,
      ),
    ).toBe(false);
  });

  test('check to throw an exception if createRoom fails and gives a NULL back', async () => {
    when(clientMock.createRoom(anything())).thenResolve(null as any);
    await expect(
      meetingService.createMeeting(
        userContext,
        createEvent(PARENT_MEETING_ROOM_ID),
      ),
    ).rejects.toThrow(new RoomNotCreatedError());
  });

  test('check the delete flag when appConfiguration.auto_deletion_offset is defined', async () => {
    appConfig.auto_deletion_offset = 5;

    await meetingService.createMeeting(
      userContext,
      createEvent(PARENT_MEETING_ROOM_ID),
    );

    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
  });

  test('check the delete flag if appConfiguration.auto_deletion_offset is undefined', async () => {
    appConfig.auto_deletion_offset = undefined;

    await meetingService.createMeeting(
      userContext,
      createEvent(PARENT_MEETING_ROOM_ID),
    );

    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
  });

  test('check if messaging power level is defined', async () => {
    appConfig.auto_deletion_offset = undefined;

    await meetingService.createMeeting(userContext, {
      ...createEvent(PARENT_MEETING_ROOM_ID),
      messaging_power_level: 100,
    });

    verify(clientMock.createRoom(anything())).once();
    const roomCreateOptions = capture(clientMock.createRoom).first()[0];
    expect(
      roomCreateOptions?.power_level_content_override?.events_default,
    ).toBe(100);
  });

  test('check invite sender and other users', async () => {
    const room_props = createEvent(PARENT_MEETING_ROOM_ID);
    room_props.participants = [
      new ParticipantDto('agnes', undefined),
      new ParticipantDto('peter', undefined),
      new ParticipantDto(CURRENT_USER, undefined),
    ];
    await meetingService.createMeeting(userContext, room_props);
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
    expect(roomEvent?.invite).toBeUndefined();

    const invitedUsers = getArgsFromCaptor(capture(clientMock.sendStateEvent))
      .filter(([, eventType]) => eventType === 'm.room.member')
      .map(([, , userId]) => userId);

    expect(invitedUsers).toEqual([CURRENT_USER, 'agnes', 'peter']);
  });

  test('check invite users and the bot. Bot should not be included in the invites (because of autoinvite-behaviour)', async () => {
    const room_props = createEvent(PARENT_MEETING_ROOM_ID);
    room_props.participants = [
      new ParticipantDto('agnes', undefined),
      new ParticipantDto(BOT_USER, undefined),
      new ParticipantDto(CURRENT_USER, undefined),
    ];

    await meetingService.createMeeting(userContext, room_props);
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
    expect(roomEvent?.invite).toBeUndefined();

    const invitedUsers = getArgsFromCaptor(capture(clientMock.sendStateEvent))
      .filter(([, eventType]) => eventType === 'm.room.member')
      .map(([, , userId]) => userId);

    expect(invitedUsers).toEqual([CURRENT_USER, 'agnes']);
  });

  test('check the levels of powerusers botuser=101 others 100', async () => {
    const room_props = createEvent(PARENT_MEETING_ROOM_ID);
    await meetingService.createMeeting(userContext, room_props);
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
    expect(roomEvent?.power_level_content_override?.users).toEqual({
      [BOT_USER]: 101,
      [CURRENT_USER]: 100,
    });
  });

  test('check the levels of powerusers botuser=101 others 100 if sender is botuser', async () => {
    const room_props = createEvent(PARENT_MEETING_ROOM_ID);
    const newUserContext = { ...userContext, userId: BOT_USER };
    await meetingService.createMeeting(newUserContext, room_props);
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent);
    expect(roomEvent?.power_level_content_override?.users).toEqual({
      [BOT_USER]: 101,
    });
  });

  test('check isCustomConfiguredWidget with unconfigured widgetId', () => {
    expect(widgetService.isCustomConfiguredWidget('asdf')).toBeFalsy();
  });

  test('check isCustomConfiguredWidget with configured widgetId', () => {
    expect(widgetService.isCustomConfiguredWidget('jitsi')).toBeTruthy();
  });

  test('check auto-invite', async () => {
    const newDefaultEvents = new RoomMatrixEventsHelper(
      '',
    ).buildRoomMatrixEvents(
      [
        ...roomMatrixEvents.stateEvents,
        iStateEventHelper.fromPartial({
          type: 'm.room.member',
          state_key: 'a',
          content: {},
        }),
        iStateEventHelper.fromPartial({
          type: 'm.room.member',
          state_key: 'b',
          content: {},
        }),
        iStateEventHelper.fromPartial({
          type: 'm.room.member',
          state_key: BOT_USER,
          content: {},
        }),
      ],
      roomMatrixEvents.roomEvents,
    );

    meetingService = new MeetingService(
      jitsiClientMock,
      client,
      new RoomMessageService(client, meetingClient),
      new MeetingClient(client, eventContentRenderer),
      appConfig,
      widgetService,
      newDefaultEvents,
      eventContentRenderer,
      new WidgetLayoutService(layoutConfigs),
    );

    await meetingService.createMeeting(
      userContext,
      createEvent(PARENT_MEETING_ROOM_ID),
    );
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];

    checkStandardFields(roomEvent);
    expect(roomEvent?.power_level_content_override?.users?.[BOT_USER]).toBe(
      101,
    );
  });

  test('check converting event to roomProps for the call of client.createRoom', async () => {
    await meetingService.createMeeting(
      userContext,
      createEvent(PARENT_MEETING_ROOM_ID),
    );
    verify(clientMock.createRoom(anything())).once();
    const roomEvent = capture(clientMock.createRoom).first()[0];

    checkStandardFields(roomEvent);

    const map = getInitialStatesAsMap(roomEvent);

    const room_history = map[StateEventName.M_ROOM_HISTORY_VISIBILITY_EVENT];
    expect(room_history.content.history_visibility).toBe('joined');

    const join_rules = map[StateEventName.M_ROOM_JOIN_RULES_EVENT];
    expect(join_rules.content.join_rule).toBe('public');

    expect(roomEvent?.power_level_content_override?.users).toEqual({
      [BOT_USER]: 101,
      [CURRENT_USER]: 100,
    });
  });

  test('check to not add the breakoutwidget', async () => {
    const parentRoomBuilder: RoomEventsBuilder = new RoomEventsBuilder(
      CURRENT_USER,
      PARENT_MEETING_ROOM_ID,
      MAIN_NON_MEETING_ROOM_ID,
    );
    parentRoomBuilder.withWidgetType('net.nordeck.meetings.widget.meeting');
    parentRoomBuilder.build();

    const room_props: MeetingCreateDto = createEvent(PARENT_MEETING_ROOM_ID);

    when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenReturn(
      Promise.resolve(parentRoomBuilder.build()),
    );
    when(clientMock.createRoom(anything())).thenResolve(
      MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID,
    );
    await meetingService.createMeeting(
      userContext,
      room_props,
      MeetingType.BREAKOUT_SESSION,
    );

    const roomEvent = capture(clientMock.createRoom).first()[0];
    checkStandardFields(roomEvent, MeetingType.BREAKOUT_SESSION);
    verify(
      clientMock.sendStateEvent(
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID,
        'io.element.widgets.layout',
        anything(),
        anything(),
      ),
    ).times(0);

    const stateEventCalls = getArgsFromCaptor(
      capture(clientMock.sendStateEvent),
    );

    const widgets = stateEventCalls
      .filter(
        ([roomId, eventType]) =>
          roomId === MEETINGROOM_WITHOUT_WIDGETS_UNDER_MEETING_ROOM_ID &&
          eventType === 'im.vector.modular.widgets',
      )
      .map(([, , widgetId]) => widgetId);

    expect(widgets).toEqual([
      expect.stringMatching(/^net\.nordeck\.meetings\.widget\.cockpit-.*/),
      'jitsi',
      'etherpad',
      'whiteboard',
    ]);
  });

  test('check to add the the breakoutwidget', async () => {
    const parentRoomBuilder: RoomEventsBuilder = new RoomEventsBuilder(
      CURRENT_USER,
      MAIN_NON_MEETING_ROOM_ID,
      null,
    );
    parentRoomBuilder.withWidgetType('net.nordeck.meetings.widget.meeting');
    parentRoomBuilder.build();
    const mainRoom: any = create_test_meeting(
      CURRENT_USER,
      MAIN_NON_MEETING_ROOM_ID,
      null,
      ['jitsi', 'etherpad', 'whiteboard', 'cockpit', 'meetings'],
      false,
    );

    const room_props: MeetingCreateDto = createEvent(MAIN_NON_MEETING_ROOM_ID);

    when(clientMock.getRoomState(MAIN_NON_MEETING_ROOM_ID)).thenReturn(
      Promise.resolve(mainRoom),
    );
    when(clientMock.createRoom(anything())).thenResolve(
      MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID,
    );
    await meetingService.createMeeting(userContext, room_props);

    verify(clientMock.createRoom(anything())).once();

    verify(
      clientMock.sendStateEvent(
        MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID,
        'io.element.widgets.layout',
        anything(),
        anything(),
      ),
    ).times(0);

    const stateEventCalls = getArgsFromCaptor(
      capture(clientMock.sendStateEvent),
    );

    const widgets = stateEventCalls
      .filter(
        ([roomId, eventType]) =>
          roomId === MEETINGROOM_WITHOUT_WIDGETS_UNDER_NON_MEETING_ROOM_ID &&
          eventType === 'im.vector.modular.widgets',
      )
      .map(([, , widgetId]) => widgetId);

    expect(widgets).toEqual([
      expect.stringMatching(
        /^net\.nordeck\.meetings\.widget\.breakoutsessions-.*/,
      ),
      expect.stringMatching(/^net\.nordeck\.meetings\.widget\.cockpit-.*/),
      'jitsi',
      'etherpad',
      'whiteboard',
    ]);
  });

  test('check close room with known meeting/room id', async () => {
    const a: any = create_test_meeting(
      CURRENT_USER,
      PARENT_MEETING_ROOM_ID,
      null,
    );
    when(
      clientMock.doRequest('GET', MatrixEndpoint.MATRIX_CLIENT_SYNC),
    ).thenResolve([]);
    when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(a); // TODO load the room with configured json
    when(
      clientMock.sendStateEvent(anything(), anything(), anything(), anything()),
    ).thenResolve('asdfsadf');
    const closeDto = new MeetingCloseDto(
      PARENT_MEETING_ROOM_ID,
      MeetingCloseMethod.TOMBSTONE,
    );
    await meetingService.closeMeeting(userContext, closeDto);
    verify(
      clientMock.sendStateEvent(
        PARENT_MEETING_ROOM_ID,
        StateEventName.M_ROOM_TOMBSTONE_EVENT,
        anything(),
        anything(),
      ),
    ).once();
    //verify(clientMock.createRoom(anything())).once();
  });

  test('check close with children', async () => {
    when(
      clientMock.sendStateEvent(anything(), anything(), anything(), anything()),
    ).thenResolve('asdfsadf');
    const closeDto = new MeetingCloseDto(
      PARENT_MEETING_ROOM_ID,
      MeetingCloseMethod.TOMBSTONE,
    );
    await meetingService.closeMeeting(userContext, closeDto);

    const closedRooms = getArgsFromCaptor(capture(clientMock.sendStateEvent))
      .filter(
        ([_, eventType]) => eventType === StateEventName.M_ROOM_TOMBSTONE_EVENT,
      )
      .map(([roomId]) => roomId);

    expect(closedRooms).toEqual(
      expect.arrayContaining([
        PARENT_MEETING_ROOM_ID,
        'childRoom1',
        'childRoom2',
      ]),
    );
  });

  test('subMeetingsSendMessage', async () => {
    const event = {
      type: 'net.nordeck.meetings.sub_meetings.send_message',
      content: {
        message: 'hello',
      },
    };
    await expect(
      meetingService.subMeetingsSendMessage(
        userContext,
        new SubMeetingsSendMessageDto(
          PARENT_MEETING_ROOM_ID,
          event.content.message,
        ),
      ),
    ).resolves.toBeUndefined();

    expect(getArgsFromCaptor(capture(clientMock.sendHtmlNotice))).toEqual([
      ['childRoom1', '<b>displayname:</b> hello'],
      ['childRoom2', '<b>displayname:</b> hello'],
    ]);
  });

  test('parent children rooms with spaces', async () => {
    const parentId = PARENT_MEETING_ROOM_ID;
    const childId = ROOM_ID;

    when(clientMock.createRoom(anything())).thenResolve(parentId);
    await meetingService.createMeeting(userContext, createEvent(parentId));

    resetCalls(clientMock); // reset to avoid mixing parent and child creation

    when(clientMock.createRoom(anything())).thenResolve(childId);
    await meetingService.createMeeting(userContext, createEvent(parentId));

    const childRoomEvent = capture(clientMock.createRoom).first()[0];
    const child1InitialState = childRoomEvent?.initial_state as any[];

    // child room must have m.space.parent state event with state_key equal to parent room id
    expect(
      child1InitialState
        .filter((s) => s.type === StateEventName.M_SPACE_PARENT_EVENT)
        .map((s) => s.state_key),
    ).toEqual([parentId]);

    expect(
      child1InitialState.filter(
        (s) =>
          s.type === StateEventName.NIC_MEETINGS_METADATA_EVENT &&
          s.content.PARENT_MEETING_ROOM_ID,
      ),
    ).toHaveLength(0);

    // parent must receive m.space.child state event with child id
    verify(
      clientMock.sendStateEvent(
        parentId,
        StateEventName.M_SPACE_CHILD_EVENT,
        childId,
        anything(),
      ),
    ).times(1);

    const parentRoomStateEvents = getArgsFromCaptor(
      capture(clientMock.sendStateEvent),
    )
      .filter(
        ([_, eventType]) => eventType === StateEventName.M_SPACE_CHILD_EVENT,
      )
      .map(
        ([, type, state_key, content]) =>
          ({
            type,
            state_key,
            content,
          }) as IStateEvent<unknown>,
      );

    // parent children via spaces must contain one child created before
    expect(new Room(parentId, parentRoomStateEvents).spaceSubRooms).toEqual({
      [childId]: expect.anything(),
    });
  });

  test('change the parent room on meeting creation is not possible', async () => {
    const parentId = PARENT_MEETING_ROOM_ID;
    const childId = ROOM_ID;
    const roomBuilder44444: RoomEventsBuilder = new RoomEventsBuilder(
      CURRENT_USER,
      '44444',
      undefined,
    );
    when(clientMock.getRoomState('44444')).thenReturn(
      Promise.resolve(roomBuilder44444.build()),
    );

    when(clientMock.createRoom(anything())).thenResolve(parentId);
    await meetingService.createMeeting(userContext, createEvent(parentId));

    resetCalls(clientMock); // reset to avoid mixing parent and child creation

    const room_props = createEvent('44444');

    when(clientMock.createRoom(anything())).thenResolve(childId);
    await meetingService.createMeeting(userContext, room_props);

    const childRoomEvent = capture(clientMock.createRoom).first()[0];
    const child1InitialState = childRoomEvent?.initial_state as any[];

    // child room must have m.space.parent state event with state_key equal to the id of the sending event and can not be overridden on meeting-creation
    expect(
      child1InitialState
        .filter((s) => s.type === StateEventName.M_SPACE_PARENT_EVENT)
        .map((s) => s.state_key),
    ).toEqual(['44444']);
  });

  test.only('should invite users', async () => {
    const roomId = 'a1';

    const roomCreationEvent: IStateEvent<any> = {
      type: StateEventName.M_ROOM_CREATION_EVENT,
      ...stateEventStub,
      sender: CURRENT_USER,
      content: {
        type: MeetingType.MEETING,
      },
    };

    const nicMeetingMetadataEvent: IStateEvent<IMeetingsMetadataEventContent> =
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT as string,
        ...stateEventStub,
        content: {
          calendar: [
            {
              uid: 'entry-0',
              dtstart: { tzid: 'UTC', value: '20220101T100000' },
              dtend: { tzid: 'UTC', value: '20220101T110000' },
              rrule: 'FREQ=DAILY;COUNT=3',
            },
          ],
          force_deletion_at: new Date('2022-01-01T11:05:00Z').getTime(),
          creator: CURRENT_USER,
        },
      };

    const powerLevelsEvent: IStateEvent<PowerLevelsEventContent> = {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      ...stateEventStub,
      content: {
        events_default: 50,
        users: {
          [BOT_USER]: 101,
          [CURRENT_USER]: 100,
        },
      },
    };

    const topicEvent: IStateEvent<RoomTopicEventContent> = {
      type: StateEventName.M_ROOM_TOPIC_EVENT,
      ...stateEventStub,
      content: {
        topic: 'good meeting',
      },
    };

    const userId1 = '@user_1:localhost';
    const userId2 = '@user_2:localhost';

    when(clientMock.getRoomState(roomId)).thenResolve([
      roomCreationEvent,
      nicMeetingMetadataEvent,
      powerLevelsEvent,
      topicEvent,
    ]);

    when(
      clientMock.sendStateEvent(anything(), anything(), anything(), anything()),
    ).thenResolve('some-event-id');

    await meetingService.handleParticipants(
      userContext,
      new MeetingParticipantsHandleDto(roomId, true, [userId1, userId2]),
    );

    const usersInvited = getArgsFromCaptor(capture(clientMock.sendStateEvent))
      .filter(
        ([, eventType, _, content]) =>
          eventType === StateEventName.M_ROOM_MEMBER_EVENT &&
          (content as IElementMembershipEventContent).membership === 'invite',
      )
      .map(([, , userId, { reason }]) => ({ userId, reason }));

    expect(usersInvited).toEqual([
      {
        userId: userId1,
        reason: `📅 1/1/2022, 10:00 – 11:00 AM UTC\n🔁 Recurrence: Every day for 3 times\nyou've been invited to a meeting by displayname\ngood meeting`,
      },
      {
        userId: userId2,
        reason: `📅 1/1/2022, 10:00 – 11:00 AM UTC\n🔁 Recurrence: Every day for 3 times\nyou've been invited to a meeting by displayname\ngood meeting`,
      },
    ]);
  });

  test('should remove users', async () => {
    const parentId = PARENT_MEETING_ROOM_ID;

    when(clientMock.createRoom(anything())).thenResolve(parentId);
    await meetingService.createMeeting(userContext, createEvent(parentId));

    when(clientMock.kickUser(anything(), anything(), anything())).thenResolve(
      undefined,
    );
    const userIds = ['@peterpan:synapse.dev.nordeck.systems'];

    await expect(
      meetingService.handleParticipants(
        userContext,
        new MeetingParticipantsHandleDto(parentId, false, userIds),
      ),
    ).resolves.toBeUndefined();

    const initialKickedUsers = getArgsFromCaptor(capture(clientMock.kickUser))
      .filter(([_, roomId]) => roomId === parentId)
      .map(([userId]) => userId);
    expect(initialKickedUsers).toEqual([
      '@peterpan:synapse.dev.nordeck.systems',
    ]);

    resetCalls(clientMock);
    userIds.push('a');
    userIds.push('b');
    userIds.push('b');
    await expect(
      meetingService.handleParticipants(
        userContext,
        new MeetingParticipantsHandleDto(parentId, false, userIds),
      ),
    ).resolves.toBeUndefined();

    const extraKicks = getArgsFromCaptor(capture(clientMock.kickUser))
      .filter(([_, roomId]) => roomId === parentId)
      .map(([userId]) => userId);
    expect(extraKicks).toEqual([
      '@peterpan:synapse.dev.nordeck.systems',
      'a',
      'b',
    ]);

    await expect(
      meetingService.handleParticipants(
        userContext,
        new MeetingParticipantsHandleDto(parentId, false, [
          'a',
          '@admin_user:localhost',
        ]),
      ),
    ).rejects.toThrow(
      new PermissionError(
        'User userWhoIsSending has not enough power level to kick @admin_user:localhost',
      ),
    );
  });

  test('changeMessagingPermissions', async () => {
    const roomId = 'a1';

    const powerLevelsEvent: IStateEvent<PowerLevelsEventContent> = {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      ...stateEventStub,
      content: {
        events_default: 50,
        events: {
          [StateEventName.M_ROOM_POWER_LEVELS_EVENT as string]: 50,
        },
        users: {
          [CURRENT_USER]: 100,
        },
      },
    };
    const stateEvents: any[] = [powerLevelsEvent];
    when(clientMock.getRoomState(roomId)).thenResolve(stateEvents);

    const powerLevel = 100;
    const messagingPermissions = new MeetingChangeMessagingPermissionDto(
      roomId,
      powerLevel,
    );

    await meetingService.changeMessagingPermissions(
      userContext,
      messagingPermissions,
    );

    const powerLevelsEventContentUpdated: PowerLevelsEventContent = {
      ...powerLevelsEvent.content,
      events_default: powerLevel,
    };

    verify(
      clientMock.sendStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
        deepEqual(powerLevelsEventContentUpdated),
      ),
    ).once();
  });

  test('createBreakOutSessions', async () => {
    const groups: BreakoutSessionsDetailDto[] = [
      new BreakoutSessionsDetailDto('t1', [
        new ParticipantDto('p1', undefined),
      ]),
      new BreakoutSessionsDetailDto('t2', [
        new ParticipantDto('p2', undefined),
      ]),
    ];

    const breakoutSessions = new BreakoutSessionsDto(
      groups,
      TOPIC,
      START,
      END,
      [],
      true,
    );

    when(clientMock.createRoom(anything()))
      .thenResolve('breakout-room-0')
      .thenResolve('breakout-room-1');

    await meetingService.createBreakOutSessions(
      userContext,
      PARENT_MEETING_ROOM_ID,
      breakoutSessions,
    );

    const roomNames = getArgsFromCaptor(capture(clientMock.createRoom)).map(
      (args) => args[0]?.name,
    );
    expect(roomNames).toEqual(['t1', 't2']);

    const roomInvitations = getArgsFromCaptor(
      capture(clientMock.sendStateEvent),
    )
      .filter(([, eventType]) => eventType === 'm.room.member')
      .map(([roomId, , userId]) => [roomId, userId]);

    expect(roomInvitations).toEqual([
      ['breakout-room-0', CURRENT_USER],
      ['breakout-room-0', 'p1'],
      ['breakout-room-1', CURRENT_USER],
      ['breakout-room-1', 'p2'],
    ]);
  });

  test('updateMeetingDetails', async () => {
    const roomId = 'a1';

    const startTime = '2022-01-01T00:00:00.000Z';
    const endTime = '2022-01-03T00:00:00.000Z';
    const autoDeletionOffset = 0;

    const roomCreationEvent: IStateEvent<any> = {
      type: StateEventName.M_ROOM_CREATION_EVENT,
      ...stateEventStub,
      sender: CURRENT_USER,
      content: {
        type: MeetingType.MEETING,
      },
    };
    const externalData: ExternalData = {
      domain: {
        id: '1',
      },
    };
    const nicMeetingMetadataEvent: IStateEvent<IMeetingsMetadataEventContent> =
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT as string,
        ...stateEventStub,
        content: {
          calendar: [
            {
              uid: 'entry-0',
              dtstart: { tzid: 'UTC', value: '20220101T000000' },
              dtend: { tzid: 'UTC', value: '20220103T000000' },
            },
          ],
          force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
          creator: CURRENT_USER,
          external_data: externalData,
        },
      };

    const powerLevelsEvent: IStateEvent<PowerLevelsEventContent> = {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      ...stateEventStub,
      content: {
        events_default: 50,
        users: {
          [BOT_USER]: 101,
          [CURRENT_USER]: 100,
        },
      },
    };

    const userId1 = '@user_1:localhost';
    const userId2 = '@user_2:localhost';
    const userId3 = '@user_3:localhost';
    const userId4 = '@user_4:localhost';
    const memberEvents: IStateEvent<IElementMembershipEventContent>[] = [
      {
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        ...stateEventStub,
        state_key: userId1,
        content: {
          membership: 'join',
        },
      },
      {
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        ...stateEventStub,
        state_key: userId2,
        content: {
          membership: 'invite',
          reason: 'good reason',
          'io.element.html_reason': 'good reason',
        },
      },
      {
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        ...stateEventStub,
        state_key: userId3,
        content: {
          membership: 'invite',
          // already contains the expected value WITHOUT trailing space.
          reason: `📅 2/1/2022, 12:00 AM UTC – 2/3/2022, 12:00 AM UTC\nyou've been invited to a meeting by displayname\ndescription1`,
          'io.element.html_reason': 'good reason',
        },
      },
      {
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        ...stateEventStub,
        state_key: userId4,
        content: {
          membership: 'invite',
          // already contains the expected value WITH trailing space.
          reason: `📅 2/1/2022, 12:00 AM UTC – 2/3/2022, 12:00 AM UTC\nyou've been invited to a meeting by displayname\ndescription1 `,
          'io.element.html_reason': 'good reason',
        },
      },
    ];

    when(clientMock.getRoomState(roomId)).thenResolve([
      roomCreationEvent,
      nicMeetingMetadataEvent,
      powerLevelsEvent,
      ...memberEvents,
    ]);

    const startTime1 = '2022-02-01T00:00:00Z';
    const endTime1 = '2022-02-03T00:00:00Z';

    const title1 = 'title1';
    const description1 = 'description1';

    const externalData1: ExternalData = {
      domain: {
        id: '2',
      },
    };
    const meetingDetails = new MeetingUpdateDetailsDto(
      roomId,
      startTime1,
      endTime1,
      undefined,
      title1,
      description1,
      externalData1,
    );
    await meetingService.updateMeetingDetails(userContext, meetingDetails);

    expect(
      getArgsFromCaptor(capture(clientMock.sendStateEvent))
        .filter(
          ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
        )
        .map(([, , , content]) => content),
    ).toEqual([
      {
        creator: CURRENT_USER,
        calendar: [
          {
            uid: expect.any(String),
            dtstart: { tzid: 'UTC', value: '20220201T000000' },
            dtend: { tzid: 'UTC', value: '20220203T000000' },
            rrule: undefined,
          },
        ],
        force_deletion_at: new Date('2022-02-03T00:05:00Z').getTime(),
        external_data: externalData1,
      },
    ]);

    verify(
      clientMock.sendStateEvent(
        roomId,
        StateEventName.M_ROOM_NAME_EVENT,
        '',
        deepEqual({ name: title1 }),
      ),
    ).once();
    verify(
      clientMock.sendStateEvent(
        roomId,
        StateEventName.M_ROOM_TOPIC_EVENT,
        '',
        deepEqual({ topic: description1 }),
      ),
    ).once();

    const usersInvitedAgain = getArgsFromCaptor(
      capture(clientMock.sendStateEvent),
    )
      .filter(
        ([, eventType, _, content]) =>
          eventType === StateEventName.M_ROOM_MEMBER_EVENT &&
          (content as IElementMembershipEventContent).membership === 'invite',
      )
      .map(([, , userId, { reason }]) => ({ userId, reason }));

    expect(usersInvitedAgain).toEqual([
      {
        userId: userId2,
        // was different, should be replaced without trailing space
        reason: expect.stringMatching(
          /you've been invited to a meeting by displayname\ndescription1$/,
        ),
      },
      {
        userId: userId3,
        // was equal; should end with space
        reason: expect.stringMatching(
          /you've been invited to a meeting by displayname\ndescription1 $/,
        ),
      },
      {
        userId: userId4,
        // was equal; should remove space
        reason: expect.stringMatching(
          /you've been invited to a meeting by displayname\ndescription1$/,
        ),
      },
    ]);

    // check if description can be reset
    meetingDetails.description = '';
    await meetingService.updateMeetingDetails(userContext, meetingDetails);

    verify(
      clientMock.sendStateEvent(
        roomId,
        StateEventName.M_ROOM_TOPIC_EVENT,
        '',
        deepEqual({ topic: '' }),
      ),
    ).once();

    // check if the room can be upgraded to the new data model
    meetingDetails.calendar = [
      {
        uid: 'entry-0',
        dtstart: { tzid: 'UTC', value: '20220201T000000' },
        dtend: { tzid: 'UTC', value: '20220203T000000' },
      },
    ];
    delete meetingDetails.start_time;
    delete meetingDetails.end_time;
    await meetingService.updateMeetingDetails(userContext, meetingDetails);

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      start_time: undefined,
      end_time: undefined,
      calendar: [
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20220201T000000' },
          dtend: { tzid: 'UTC', value: '20220203T000000' },
        },
      ],
      auto_deletion_offset: undefined,
      force_deletion_at: new Date('2022-02-03T00:05:00Z').getTime(),
      external_data: externalData1,
    });

    let msg = capture(clientMock.sendHtmlText).last()[1];
    expect(msg).not.toContain('Repeat meeting');

    meetingDetails.calendar = [
      {
        uid: 'entry-0',
        dtstart: { tzid: 'UTC', value: '20220201T000000' },
        dtend: { tzid: 'UTC', value: '20220203T000000' },
        rrule: 'FREQ=DAILY;COUNT=3',
      },
    ];
    await meetingService.updateMeetingDetails(userContext, meetingDetails);

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      start_time: undefined,
      end_time: undefined,
      calendar: [
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20220201T000000' },
          dtend: { tzid: 'UTC', value: '20220203T000000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
      ],
      auto_deletion_offset: undefined,
      force_deletion_at: new Date('2022-02-05T00:05:00Z').getTime(),
      external_data: externalData1,
    });

    msg = capture(clientMock.sendHtmlText).last()[1];
    expect(msg).toContain('Repeat meeting: Every day for 3 times');
    expect(msg).toContain('(previously: )');

    delete meetingDetails.calendar;
    meetingDetails.start_time = '2022-02-01T10:00:00Z';
    meetingDetails.end_time = '2022-02-01T11:00:00Z';
    await meetingService.updateMeetingDetails(userContext, meetingDetails);

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: expect.any(String),
          dtstart: { tzid: 'UTC', value: '20220201T100000' },
          dtend: { tzid: 'UTC', value: '20220201T110000' },
          rrule: undefined,
        },
      ],
      force_deletion_at: new Date('2022-02-01T11:05:00Z').getTime(),
      external_data: externalData1,
    });

    msg = capture(clientMock.sendHtmlText).last()[1];
    expect(msg).not.toContain('Repeat meeting: ');

    // OX meeting with empty rrules should be updated
    const externalDataOx: ExternalData = {
      'io.ox': {
        folder: 'cal://0/301',
        id: '1',
        rrules: [],
      },
    };

    when(clientMock.getRoomState(roomId)).thenResolve([
      roomCreationEvent,
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT as string,
        ...stateEventStub,
        content: {
          start_time: startTime,
          end_time: endTime,
          auto_deletion_offset: autoDeletionOffset,
          creator: CURRENT_USER,
          external_data: externalData,
        },
      },
      powerLevelsEvent,
      ...memberEvents,
    ]);

    const meetingDetailsOx = new MeetingUpdateDetailsDto(
      roomId,
      startTime,
      endTime,
      undefined,
      title1,
      description1,
      externalDataOx,
    );
    await meetingService.updateMeetingDetails(userContext, meetingDetailsOx);

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: expect.any(String),
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: undefined,
        },
      ],
      force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
      external_data: externalDataOx,
    } as IMeetingsMetadataEventContent);

    msg = capture(clientMock.sendHtmlText).last()[1];
    expect(msg).not.toContain('Repeat meeting: ');

    when(clientMock.getRoomState(roomId)).thenResolve([
      roomCreationEvent,
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT as string,
        ...stateEventStub,
        content: {
          start_time: startTime,
          end_time: endTime,
          calendar: [
            {
              uid: 'entry-0',
              dtstart: { tzid: 'UTC', value: '20220101T000000' },
              dtend: { tzid: 'UTC', value: '20220103T000000' },
            },
          ],
          force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
          creator: CURRENT_USER,
          external_data: externalData,
        },
      },
      powerLevelsEvent,
      ...memberEvents,
    ]);

    await meetingService.updateMeetingDetails(
      userContext,
      new MeetingUpdateDetailsDto(
        roomId,
        '2022-01-01T01:00:00.000Z',
        '2022-01-03T01:00:00.000Z',
        undefined,
        title1,
        description1,
        externalDataOx,
      ),
    );

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: 'entry-0', // id must stay!
          dtstart: { tzid: 'UTC', value: '20220101T010000' },
          dtend: { tzid: 'UTC', value: '20220103T010000' },
          rrule: undefined,
        },
      ],
      auto_deletion_offset: undefined,
      force_deletion_at: new Date('2022-01-03T01:05:00Z').getTime(),
      external_data: externalDataOx,
    } as IMeetingsMetadataEventContent);

    // OX meeting with non-empty rrules should send 'net.nordeck.meetings.metadata' event with calendar
    const externalDataOx1: ExternalData = {
      'io.ox': {
        folder: 'cal://0/301',
        id: '1',
        rrules: ['FREQ=DAILY;COUNT=1'],
      },
    };
    meetingDetailsOx.external_data = externalDataOx1;

    await meetingService.updateMeetingDetails(userContext, meetingDetailsOx);

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.sendStateEvent))
          .filter(
            ([, type]) => type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
          )
          .map(([, , , content]) => content),
      ),
    ).toEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: 'entry-0', // id must stay!
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: 'FREQ=DAILY;COUNT=1',
        },
      ],
      auto_deletion_offset: undefined,
      force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
      external_data: externalDataOx1,
    } as IMeetingsMetadataEventContent);

    msg = capture(clientMock.sendHtmlText).last()[1];
    expect(msg).toContain('Repeat meeting: Every day for one time');
    expect(msg).toContain('(previously: No repetition)');
  });

  test('getSharingInformationAsync', async () => {
    const roomId = 'a1';

    const roomCreationEvent: IStateEvent<any> = {
      type: StateEventName.M_ROOM_CREATION_EVENT,
      ...stateEventStub,
      sender: CURRENT_USER,
      content: {
        type: MeetingType.MEETING,
      },
    };

    const nicMeetingMetadataEvent: IStateEvent<IMeetingsMetadataEventContent> =
      {
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT as string,
        ...stateEventStub,
        content: {
          creator: CURRENT_USER,
          calendar: [
            {
              uid: 'entry-0',
              dtstart: { tzid: 'UTC', value: '20220101T000000' },
              dtend: { tzid: 'UTC', value: '20220103T000000' },
              rrule: undefined,
            },
          ],
        },
      };

    const stateEvents: any[] = [roomCreationEvent, nicMeetingMetadataEvent];
    when(clientMock.getRoomState(roomId)).thenResolve(stateEvents);

    const sharingInfoDto: MeetingSharingInformationDto = {
      jitsi_dial_in_number: '1',
      jitsi_pin: 1,
    };

    when(jitsiClientMock.getSharingInformationAsync(roomId)).thenResolve(
      sharingInfoDto,
    );

    expect(
      await meetingService.getSharingInformationAsync(roomId),
    ).toStrictEqual(sharingInfoDto);

    verify(jitsiClientMock.getSharingInformationAsync(roomId)).once();
  });

  describe('widget tests', () => {
    const parentId = PARENT_MEETING_ROOM_ID;

    const callInfo = (
      callIdx: number,
      paramIdx: SendStateEventParameter,
      name: StateEventName,
    ) => captureSendStateEvent(clientMock, callIdx, paramIdx, name);

    beforeEach(() => {
      const parentRoom: any = create_test_meeting(
        CURRENT_USER,
        PARENT_MEETING_ROOM_ID,
        null,
        [],
      );
      when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(
        parentRoom,
      );
      when(clientMock.createRoom(anything())).thenResolve(parentId);
      when(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
          anything(),
          anything(),
        ),
      ).thenResolve(undefined as any);
    });

    test('add 2 widgets', async () => {
      const event = createEvent(parentId);
      event.widget_ids = ['poll', 'whiteboard'];
      await meetingService.createMeeting(userContext, event);

      const e = StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT;
      verify(
        clientMock.sendStateEvent(parentId, e, anything(), anything()),
      ).times(4);

      // content.type
      expect(callInfo(0, SendStateEventParameter.Content, e).type).toBe(
        WidgetType.BREAKOUT_SESSIONS,
      );
      expect(callInfo(1, SendStateEventParameter.Content, e).type).toBe(
        WidgetType.COCKPIT,
      );
      expect(callInfo(2, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.poll',
      );
      expect(callInfo(3, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.whiteboard',
      );

      // state key
      expect(callInfo(0, SendStateEventParameter.StateKey, e)).toMatch(
        new RegExp(`${_.escapeRegExp(WidgetType.BREAKOUT_SESSIONS)}-.*`),
      );
      expect(callInfo(1, SendStateEventParameter.StateKey, e)).toMatch(
        new RegExp(`${_.escapeRegExp(WidgetType.COCKPIT)}-.*`),
      );
      expect(callInfo(2, SendStateEventParameter.StateKey, e)).toBe('poll');
      expect(callInfo(3, SendStateEventParameter.StateKey, e)).toBe(
        'whiteboard',
      );

      // content.id
      expect(callInfo(0, SendStateEventParameter.Content, e).id).toBe(
        callInfo(0, 2, e),
      ); //  content.id === state_key
      expect(callInfo(1, SendStateEventParameter.Content, e).id).toBe(
        callInfo(1, 2, e),
      ); //  content.id === state_key
      expect(callInfo(2, SendStateEventParameter.Content, e).id).toBe('poll'); //  content.id === state_key
      expect(callInfo(3, SendStateEventParameter.Content, e).id).toBe(
        'whiteboard',
      ); // ignores 'whiteboard-with-custom-content.id'
    });

    test('add 1 widget, then add another', async () => {
      // room has a poll widget
      // cockpit is there after the meeting room was created
      const parentRoom: any = create_test_meeting(
        CURRENT_USER,
        PARENT_MEETING_ROOM_ID,
        null,
        ['poll', WidgetType.COCKPIT],
      );
      when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(
        parentRoom,
      );

      // add whiteboard
      const widgets = ['whiteboard'];
      await meetingService.handleWidgets(
        userContext,
        new MeetingWidgetsHandleDto(parentId, true, widgets),
      );

      const e = StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT;
      verify(
        clientMock.sendStateEvent(parentId, e, anything(), anything()),
      ).times(2);

      expect(callInfo(0, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.poll',
      ); // updated poll
      expect(callInfo(1, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.whiteboard',
      ); // added whiteboard
    });

    test('add 2 widgets, then remove 1', async () => {
      // room has 2 widgets
      // assume that there's no cockpit widget
      const parentRoom: any = create_test_meeting(
        CURRENT_USER,
        PARENT_MEETING_ROOM_ID,
        null,
        ['poll', 'whiteboard'],
      );
      when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(
        parentRoom,
      );

      // remove whiteboard
      const widgets = ['whiteboard'];
      await meetingService.handleWidgets(
        userContext,
        new MeetingWidgetsHandleDto(parentId, false, widgets),
      );

      const e = StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT;
      verify(
        clientMock.sendStateEvent(parentId, e, anything(), anything()),
      ).times(3);

      expect(callInfo(0, SendStateEventParameter.Content, e).type).toBe(
        WidgetType.COCKPIT,
      ); // added cockpit
      expect(callInfo(1, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.poll',
      ); // updated poll

      // verify removed whiteboard
      expect(callInfo(2, SendStateEventParameter.StateKey, e)).toBe(
        'whiteboard',
      );
      expect(callInfo(2, SendStateEventParameter.Content, e)).toStrictEqual({});
    });

    test('no layout config', async () => {
      const event = createEvent(parentId);
      event.widget_ids = ['poll'];
      await meetingService.createMeeting(userContext, event);
      verify(
        clientMock.sendStateEvent(
          parentId,
          StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
          anything(),
          anything(),
        ),
      ).times(0);
    });

    test('custom layout', async () => {
      const event = createEvent(parentId);
      const widgets = ['poll', 'jitsi'];
      event.widget_ids = widgets;
      await meetingService.createMeeting(userContext, event);

      // the resulting layout should exactly match the custom configuration
      const layout = layoutConfigs.find((o) =>
        _.isEqual(_.sortBy(o.widgetIds), _.sortBy(widgets)),
      );
      const expected = {
        widgets: layout?.layouts,
      };

      verify(
        clientMock.sendStateEvent(
          parentId,
          StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
          anything(),
          anything(),
        ),
      ).times(1);

      // event content
      expect(
        callInfo(0, 3, StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT),
      ).toStrictEqual(expected);
    });

    test('update room layout when widgets change', async () => {
      // room has a poll widget
      // cockpit is there after the meeting room was created
      const parentRoom: any = create_test_meeting(
        CURRENT_USER,
        PARENT_MEETING_ROOM_ID,
        null,
        ['poll', WidgetType.COCKPIT],
      );
      when(clientMock.getRoomState(PARENT_MEETING_ROOM_ID)).thenResolve(
        parentRoom,
      );

      // add jitsi
      const widgets = ['jitsi'];
      await meetingService.handleWidgets(
        userContext,
        new MeetingWidgetsHandleDto(parentId, true, widgets),
      );

      const e = StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT;
      verify(
        clientMock.sendStateEvent(parentId, e, anything(), anything()),
      ).times(2);

      expect(callInfo(0, SendStateEventParameter.Content, e).type).toBe(
        'net.nordeck.poll',
      ); // updated poll
      expect(callInfo(1, SendStateEventParameter.Content, e).type).toBe(
        'jitsi',
      ); // added jitsi
      const expected = {
        widgets: {
          poll: { container: 'top', index: 0, width: 100, height: 40 },
          jitsi: { container: 'right' },
        },
      };
      verify(
        clientMock.sendStateEvent(
          parentId,
          StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
          anything(),
          anything(),
        ),
      ).times(1);

      // event content
      expect(
        callInfo(0, 3, StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT),
      ).toStrictEqual(expected);
    });
  });

  test('createMeeting without parent with external data', async () => {
    const externalData: ExternalData = {
      'com.company': {
        id: 'company_meeting_id',
      },
    };
    const meetingCreate: MeetingCreateDto = {
      ...createEvent(undefined),
      external_data: externalData,
    };
    await meetingService.createMeeting(userContext, meetingCreate);

    verify(clientMock.createRoom(anything())).once();
    const roomEvent: IRoomCreate = capture(
      clientMock.createRoom,
    ).first()[0] as IRoomCreate;

    checkStandardFields(roomEvent, MeetingType.MEETING, null);

    const room = new Room('r1', roomEvent.initial_state);
    const metadata = room.roomEventsByName(
      StateEventName.NIC_MEETINGS_METADATA_EVENT,
    )[0]?.content as IMeetingsMetadataEventContent;
    expect(metadata.external_data).toStrictEqual(externalData);
  });

  test('createMeeting with rrule', async () => {
    appConfig.auto_deletion_offset = 60;

    const meetingCreate: MeetingCreateDto = {
      ...createEvent(PARENT_MEETING_ROOM_ID),
      start_time: undefined,
      end_time: undefined,
      calendar: [
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20220201T000000' },
          dtend: { tzid: 'UTC', value: '20220203T000000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
      ],
    };

    await meetingService.createMeeting(userContext, meetingCreate);

    verify(clientMock.createRoom(anything())).once();
    const roomEvent: IRoomCreate = capture(
      clientMock.createRoom,
    ).first()[0] as IRoomCreate;

    const nicMetadataEventContent = roomEvent.initial_state.find(
      (e) => e.type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
    )?.content as MeetingCreateDto;
    expect(nicMetadataEventContent).toStrictEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: 'entry-0',
          dtstart: { tzid: 'UTC', value: '20220201T000000' },
          dtend: { tzid: 'UTC', value: '20220203T000000' },
          rrule: 'FREQ=DAILY;COUNT=3',
        },
      ],
      force_deletion_at: new Date('2022-02-05T01:00:00Z').getTime(),
      external_data: undefined,
    });
  });

  test('createMeeting OX', async () => {
    const startTime = '2022-01-01T00:00:00.000Z';
    const endTime = '2022-01-03T00:00:00.000Z';

    const externalDataOx: ExternalData = {
      'io.ox': {
        folder: 'cal://0/301',
        id: '1',
        rrules: [],
      },
    };

    const meetingCreate: MeetingCreateDto = {
      ...createEvent(PARENT_MEETING_ROOM_ID),
      start_time: startTime,
      end_time: endTime,
      external_data: externalDataOx,
    };

    await meetingService.createMeeting(userContext, meetingCreate);

    verify(clientMock.createRoom(anything())).once();
    expect(
      last(
        getArgsFromCaptor(capture(clientMock.createRoom)).map(
          ([roomCreateOptions]) => roomCreateOptions as IRoomCreate,
        ),
      )?.initial_state.find(
        (e) => e.type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
      )?.content,
    ).toStrictEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: expect.any(String),
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: undefined,
        },
      ],
      force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
      external_data: externalDataOx,
    } as IMeetingsMetadataEventContent);

    const externalDataOx1: ExternalData = {
      'io.ox': {
        folder: 'cal://0/301',
        id: '1',
        rrules: ['FREQ=DAILY;COUNT=1'],
      },
    };
    meetingCreate.external_data = externalDataOx1;

    await meetingService.createMeeting(userContext, meetingCreate);

    verify(clientMock.createRoom(anything())).twice();

    expect(
      last(
        getArgsFromCaptor(capture(clientMock.createRoom)).map(
          ([roomCreateOptions]) => roomCreateOptions as IRoomCreate,
        ),
      )?.initial_state.find(
        (e) => e.type === StateEventName.NIC_MEETINGS_METADATA_EVENT,
      )?.content,
    ).toStrictEqual({
      creator: CURRENT_USER,
      calendar: [
        {
          uid: expect.any(String),
          dtstart: { tzid: 'UTC', value: '20220101T000000' },
          dtend: { tzid: 'UTC', value: '20220103T000000' },
          rrule: 'FREQ=DAILY;COUNT=1',
        },
      ],
      force_deletion_at: new Date('2022-01-03T00:05:00Z').getTime(),
      external_data: externalDataOx1,
    } as IMeetingsMetadataEventContent);
  });

  test('createMeeting with undefined enable_auto_deletion should take value from config', async () => {
    const meetingCreate: MeetingCreateDto = {
      ...createEvent(undefined),
      enable_auto_deletion: undefined,
    };

    await meetingService.createMeeting(userContext, meetingCreate);

    verify(clientMock.createRoom(anything())).once();
    const roomEvent: IRoomCreate = capture(
      clientMock.createRoom,
    ).first()[0] as IRoomCreate;
    checkStandardFields(roomEvent, MeetingType.MEETING, null);

    const room = new Room('r1', roomEvent.initial_state);
    const metadata = room.roomEventsByName(
      StateEventName.NIC_MEETINGS_METADATA_EVENT,
    )[0]?.content as IMeetingsMetadataEventContent;
    expect(metadata.force_deletion_at).toStrictEqual(
      new Date('2022-11-11T14:12:21Z').getTime(),
    );
  });

  test('createMeeting should return link', async () => {
    const meetingLink = await meetingService.createMeeting(
      userContext,
      createEvent(undefined),
    );

    expect(meetingLink).toStrictEqual(
      new MeetingCreateResponseDto(ROOM_ID, `https://matrix.to/#/${ROOM_ID}`),
    );
  });
});
