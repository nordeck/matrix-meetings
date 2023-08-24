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
  MatrixClient,
  MessageEventContent,
  PowerLevelsEventContent,
} from 'matrix-bot-sdk';
import { MembershipEventContent } from 'matrix-bot-sdk/src/models/events/MembershipEvent';
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  reset,
  resetCalls,
  verify,
  when,
} from 'ts-mockito';
import { AppRuntimeContext } from '../src/AppRuntimeContext';
import { EventContentRenderer } from '../src/EventContentRenderer';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { MatrixEndpoint } from '../src/MatrixEndpoint';
import { MeetingClient } from '../src/client/MeetingClient';
import { WidgetClient } from '../src/client/WidgetClient';
import { RoomMatrixEventsReader } from '../src/io/RoomMatrixEventsReader';
import { IRoomCreate } from '../src/matrix/dto/IRoomCreate';
import { IRoomEvent } from '../src/matrix/event/IRoomEvent';
import { IStateEvent } from '../src/matrix/event/IStateEvent';
import { IRoomMatrixEvents } from '../src/model/IRoomMatrixEvents';
import { Room } from '../src/model/Room';
import { StateEventName } from '../src/model/StateEventName';
import { WidgetType } from '../src/model/WidgetType';
import { CommandService } from '../src/service/CommandService';
import { ControlRoomMigrationService } from '../src/service/ControlRoomMigrationService';
import { RoomMessageService } from '../src/service/RoomMessageService';
import { WelcomeWorkflowService } from '../src/service/WelcomeWorkflowService';
import { RoomEventsBuilder } from './RoomEventsBuilder';
import {
  SendStateEventParameter,
  captureSendStateEvent,
  createAppConfig,
} from './util/MockUtils';

describe('test WelcomeWorkflowService', () => {
  const ROOM_ID = 'roomId';
  const USER_ID = 'userId';
  const BOT_ID = 'botId';

  const createEvent = (): IRoomEvent<MessageEventContent> => {
    return {
      type: 'type',
      event_id: 'some_event_id',
      sender: 'sender@matrix.org',
      content: {
        body: '!meeting help',
        msgtype: 'm.text',
      },
      origin_server_ts: Date.now(),
    };
  };

  const createStateEvent = (type: string, state_key = 'state_key') => {
    return {
      ...createEvent(),
      state_key,
      type,
    };
  };

  const createMembershipEvent = (): IStateEvent<MembershipEventContent> => {
    return {
      ...createEvent(),
      state_key: 'state',
      prev_content: {
        membership: 'invite',
      },
      content: {
        membership: 'join',
      },
    };
  };

  const createPowerLevelsEvent = (
    botPower: number,
  ): IStateEvent<PowerLevelsEventContent> => {
    return {
      ...createStateEvent(StateEventName.M_ROOM_POWER_LEVELS_EVENT, 'stateKey'),
      prev_content: {},
      content: {
        users: {
          [BOT_ID]: botPower,
        },
      },
    };
  };

  const createWidgetEvent = () => ({
    ...createStateEvent(StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT),
    content: {
      type: WidgetType.MEETINGS,
    },
  });

  const appRuntimeContext: AppRuntimeContext = {
    botUserId: BOT_ID,
    displayName: 'bot',
    localpart: 'localpart',
    supportedLngs: ['en', 'de'],
  };

  const appConfig: IAppConfiguration = createAppConfig();

  const privateRoomMarkerEvent = {
    roomId: ROOM_ID,
    originalRoomName: 'originalRoomName',
    originalRoomId: 'originalRoomId',
    locale: 'en',
    userId: USER_ID,
    userDisplayName: 'displayname',
  };

  const clientMock: MatrixClient = mock(MatrixClient);

  interface IDeps {
    meetingClient?: MeetingClient;
    commandService?: CommandService;
    roomMatrixEvents?: IRoomMatrixEvents;
    widgetClient?: WidgetClient;
    eventContentRenderer?: EventContentRenderer;
    controlRoomMigrationService?: ControlRoomMigrationService;
    roomMessageService?: RoomMessageService;
  }

  const buildWelcomeWorkflowService = (
    client: MatrixClient,
    appConfig: IAppConfiguration,
    dependencies?: IDeps,
  ) => {
    const roomMatrixEvents: IRoomMatrixEvents =
      dependencies?.roomMatrixEvents ||
      new RoomMatrixEventsReader('test/conf/test_default_events.json').read();
    const eventContentRenderer =
      dependencies?.eventContentRenderer || new EventContentRenderer(appConfig);
    const widgetClient =
      dependencies?.widgetClient ||
      new WidgetClient(
        client,
        appConfig,
        eventContentRenderer,
        roomMatrixEvents,
      );
    const meetingClient: MeetingClient =
      dependencies?.meetingClient ||
      new MeetingClient(client, eventContentRenderer);
    const controlRoomMigrationService: ControlRoomMigrationService =
      dependencies?.controlRoomMigrationService ||
      new ControlRoomMigrationService(
        client,
        meetingClient,
        widgetClient,
        appConfig,
        appRuntimeContext,
      );
    const roomMessageService: RoomMessageService =
      dependencies?.roomMessageService ||
      new RoomMessageService(client, meetingClient);

    return new WelcomeWorkflowService(
      client,
      meetingClient,
      widgetClient,
      controlRoomMigrationService,
      roomMessageService,
      appConfig,
      appRuntimeContext,
    );
  };

  const makeRoomPublic = (roomId = ROOM_ID) => {
    when(
      clientMock.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        BOT_ID,
      ),
    ).thenResolve(null);
  };

  const makeRoomPrivate = (roomId = ROOM_ID) => {
    when(
      clientMock.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        BOT_ID,
      ),
    ).thenResolve(privateRoomMarkerEvent);
  };

  const captureSendHtmlText = () => {
    return capture(clientMock.sendHtmlText).first()[1] as string;
  };

  beforeEach(() => {
    reset(clientMock);
    when(
      clientMock.doRequest(
        'GET',
        MatrixEndpoint.MATRIX_CLIENT_SYNC,
        anything(),
      ),
    ).thenResolve({
      rooms: {
        join: {
          roomId: {
            state: {
              events: [],
            },
          },
        },
      },
    });
    when(clientMock.getUserProfile(anyString())).thenResolve({
      displayname: 'displayname',
    });
  });

  it('when feature toggle is false', async () => {
    const config: IAppConfiguration = {
      ...appConfig,
      enable_welcome_workflow: false,
    };
    const service = buildWelcomeWorkflowService(instance(clientMock), config);

    await service.processRoomInvite(ROOM_ID, createMembershipEvent());
    await service.processPowerlevelChange(ROOM_ID, createPowerLevelsEvent(0));
    await service.processUserLeavePrivateRoom(ROOM_ID, createMembershipEvent());
    await service.processUserJoinedPrivateRoom(
      ROOM_ID,
      createMembershipEvent(),
    );

    verify(clientMock.on(anything(), anything)).never();
    verify(clientMock.joinRoom(anything())).never();
    verify(clientMock.leaveRoom(anything())).never();
    verify(clientMock.sendHtmlText(anything(), anything())).never();
  });

  it('smoke test, autojoin room and invite to private chat', async () => {
    when(clientMock.getRoomState(ROOM_ID)).thenResolve([]);
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    await service.processRoomInvite(ROOM_ID, createMembershipEvent());
    verify(clientMock.joinRoom(ROOM_ID)).once(); // autojoin
    verify(clientMock.createRoom(anything())).once(); // private chat
  });

  test('fetchContextStateEvent for public room', async () => {
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    when(
      clientMock.getRoomStateEvent(
        ROOM_ID,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        BOT_ID,
      ),
    ).thenThrow(new Error('NIC_MEETINGS_WELCOME_ROOM state event not found'));
    const result = await service.fetchContextStateEvent(ROOM_ID);
    expect(result).toBeNull();
  });

  it('processRoomInvite', async () => {
    when(clientMock.getRoomState(ROOM_ID)).thenResolve([]);
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    const privateRoomId = 'new_room_id';
    const e = {
      ...createMembershipEvent(),
      sender: USER_ID, // this user invited the bot
    };
    when(clientMock.createRoom(anything())).thenResolve(privateRoomId);

    await service.processRoomInvite(ROOM_ID, e);

    verify(clientMock.joinRoom(ROOM_ID)).once(); // autojoin

    // create a private chat room
    const { preset, initial_state } = capture(
      clientMock.createRoom,
    ).first()[0] as IRoomCreate;
    expect(preset).toBe('trusted_private_chat');
    expect(
      initial_state.some(
        (o) => o.type === StateEventName.NIC_MEETINGS_WELCOME_ROOM,
      ),
    ).toBe(true);

    // invite the sender
    verify(
      clientMock.sendStateEvent(
        privateRoomId,
        'm.room.member',
        USER_ID,
        anything(),
      ),
    ).once();
    const { membership }: { membership: string } = capture(
      clientMock.sendStateEvent,
    ).last()[3] as any;
    expect(membership).toBe('invite');
  });

  test('processUserLeavePrivateRoom - undefined membership', async () => {
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    const event: any = {
      ...createMembershipEvent(),
      type: 'm.room.member',
      sender: 'not_a_Bot',
      content: {
        // membership: undefined
      },
    };
    makeRoomPrivate(ROOM_ID);
    await service.processUserLeavePrivateRoom(ROOM_ID, event);

    // do nothing if membership is undefined
    verify(clientMock.leaveRoom(ROOM_ID)).never();
    verify(
      clientMock.getRoomStateEvent(anything(), anything(), anything()),
    ).never();
  });

  test('processUserLeavePrivateRoom - in a public room', async () => {
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    const event: IStateEvent<MembershipEventContent> = {
      ...createMembershipEvent(),
      type: 'm.room.member',
      sender: 'not_a_Bot',
      content: {
        membership: 'leave',
      },
    };
    // don't leave public rooms
    makeRoomPublic(ROOM_ID);
    await service.processUserLeavePrivateRoom(ROOM_ID, event);
    verify(clientMock.leaveRoom(ROOM_ID)).never();
  });

  it('processUserLeavePrivateRoom - normal flow', async () => {
    const service = buildWelcomeWorkflowService(
      instance(clientMock),
      appConfig,
    );
    const event: IStateEvent<MembershipEventContent> = {
      ...createMembershipEvent(),
      type: 'm.room.member',
      sender: 'not_a_Bot',
      content: {
        membership: 'leave',
      },
    };

    makeRoomPrivate(ROOM_ID);
    await service.processUserLeavePrivateRoom(ROOM_ID, event);
    verify(clientMock.leaveRoom(ROOM_ID)).once();
  });

  describe('processPowerlevelChange', () => {
    let meetingClientMock: MeetingClient;
    let service: WelcomeWorkflowService;

    const makePowEvent = (newPower = 100) => ({
      ...createPowerLevelsEvent(newPower),
      unsigned: {
        prev_content: {
          users: {
            [BOT_ID]: 20, // old powerlevel
          },
        },
      },
    });

    const buildRoomStateEvents = () => {
      const builder = new RoomEventsBuilder('creator', ROOM_ID, null, false);
      const powerLevelEvent = builder.createPowerLevelEvent();
      const stateEvents: any[] = [powerLevelEvent];

      return stateEvents;
    };

    beforeEach(() => {
      // prepare minimal amount of room events to support adding a meeting widget into a public room
      meetingClientMock = mock(MeetingClient);
      service = buildWelcomeWorkflowService(instance(clientMock), appConfig, {
        meetingClient: instance(meetingClientMock),
      });

      makeRoomPublic(ROOM_ID);

      // prepare the initial room state
      when(meetingClientMock.fetchRoomAsync(ROOM_ID)).thenResolve(
        new Room(ROOM_ID, buildRoomStateEvents()),
      );
    });

    test('processPowerlevelChange - accept only powerlevel events', async () => {
      const event = makePowEvent();
      event.type = 'm.room.member';
      await service.processPowerlevelChange(ROOM_ID, event);
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          anything(),
          anything(),
        ),
      ).never();
    });

    it('processPowerlevelChange - widget already exists', async () => {
      // assume that widget already exists in the room
      when(meetingClientMock.fetchRoomAsync(ROOM_ID)).thenResolve(
        new Room(ROOM_ID, [createWidgetEvent()]),
      );

      await service.processPowerlevelChange(ROOM_ID, makePowEvent());
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          anything(),
          anything(),
        ),
      ).never();
    });

    it('processPowerlevelChange - private room', async () => {
      // don't add the widget into a private room
      makeRoomPrivate(ROOM_ID);
      expect(await service.isKnownPrivateRoom(ROOM_ID)).toBe(true);

      await service.processPowerlevelChange(ROOM_ID, makePowEvent());
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          anything(),
          anything(),
        ),
      ).never();
    });

    it('processPowerlevelChange - normal flow', async () => {
      expect(await service.isKnownPrivateRoom(ROOM_ID)).toBe(false);

      // mock the room powerlevels so the bot is able to edit widgets
      const events = buildRoomStateEvents();
      events[0].content.users[BOT_ID] = 80;
      when(meetingClientMock.fetchRoomAsync(ROOM_ID)).thenResolve(
        new Room(ROOM_ID, events),
      );

      // test it
      await service.processPowerlevelChange(ROOM_ID, makePowEvent(80));

      // verify that the widget was added
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          anything(),
          anything(),
        ),
      ).once();
    });
  });

  describe('processUserJoinedPrivateRoom', () => {
    const membershipEvent: IStateEvent<MembershipEventContent> = {
      ...createMembershipEvent(),
      type: 'm.room.member',
      sender: `${BOT_ID}random`,
      unsigned: {
        prev_content: {
          membership: 'invite',
        },
      },
      content: {
        membership: 'join',
      },
    };

    let service: WelcomeWorkflowService;
    const meetingClientMock: MeetingClient = mock(MeetingClient);

    beforeEach(async () => {
      reset(meetingClientMock);
      service = buildWelcomeWorkflowService(instance(clientMock), appConfig, {
        meetingClient: instance(meetingClientMock),
      });
      makeRoomPrivate();
      // needed to construct the room link in the translated messages for the original room
      // ROOM_ID is the private room
      when(
        meetingClientMock.fetchRoomAsync(privateRoomMarkerEvent.originalRoomId),
      ).thenResolve(new Room(privateRoomMarkerEvent.originalRoomId, []));
    });

    it('processUserJoinedPrivateRoom - normal flow', async () => {
      await service.processUserJoinedPrivateRoom(ROOM_ID, membershipEvent);

      // verify update topic
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.M_ROOM_TOPIC_EVENT,
          anything(),
          anything(),
        ),
      ).once();
      //verify info messages were sent
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).called();
      const txt = capture(clientMock.sendHtmlText).first()[1] as string;
      expect(txt).toMatch(/Information on the language setting/);
      expect(txt).toMatch(/Hello displayname, thank you for inviting me/);
    });

    it('processUserJoinedPrivateRoom - normal flow, widget exists', async () => {
      when(
        meetingClientMock.fetchRoomAsync(privateRoomMarkerEvent.originalRoomId),
      ).thenResolve(
        new Room(privateRoomMarkerEvent.originalRoomId, [createWidgetEvent()]),
      );

      await service.processUserJoinedPrivateRoom(ROOM_ID, membershipEvent);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).called();
      const txt = capture(clientMock.sendHtmlText).first()[1] as string;
      expect(txt).toMatch(/Information on the language setting/);
      expect(txt).toMatch(
        /Hello displayname, thank you for inviting me to the/,
      );
    });

    it('processUserJoinedPrivateRoom - public room', async () => {
      makeRoomPublic(ROOM_ID);

      await service.processUserJoinedPrivateRoom(ROOM_ID, membershipEvent);

      // verify that no welcome messages are sent into public rooms
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.M_ROOM_TOPIC_EVENT,
          anything(),
          anything(),
        ),
      ).never();
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).never();
    });
  });

  describe('commands', () => {
    let service: WelcomeWorkflowService;
    const meetingClientMock: MeetingClient = mock(MeetingClient);

    const setBotPowerlevelInRoom = (roomId: string, power: number) => {
      when(meetingClientMock.fetchRoomAsync(roomId)).thenResolve(
        new Room(roomId, [createPowerLevelsEvent(power)]),
      );
    };

    beforeEach(async () => {
      reset(meetingClientMock);
      const commandServiceMock = mock(CommandService);

      service = buildWelcomeWorkflowService(instance(clientMock), appConfig, {
        meetingClient: instance(meetingClientMock),
        commandService: instance(commandServiceMock),
      });

      makeRoomPrivate(ROOM_ID);
      setBotPowerlevelInRoom(ROOM_ID, 100);
      setBotPowerlevelInRoom(privateRoomMarkerEvent.originalRoomId, 10);
    });

    it('commands - LangCommand', async () => {
      await service.handleLanguageChange(ROOM_ID, {}, ['de']);
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.NIC_MEETINGS_WELCOME_ROOM,
          BOT_ID,
          anything(),
        ),
      ).once();
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.M_ROOM_TOPIC_EVENT,
          anything(),
          anything(),
        ),
      ).once();
      verify(
        clientMock.sendStateEvent(
          ROOM_ID,
          StateEventName.M_ROOM_NAME_EVENT,
          anything(),
          anything(),
        ),
      ).once();

      // first state event should change the locale
      const { locale } = capture(clientMock.sendStateEvent).first()[3] as any;
      expect(locale).toBe('de');
    });

    it('commands - StatusCommand - admin in the original room', async () => {
      setBotPowerlevelInRoom(privateRoomMarkerEvent.originalRoomId, 100);
      await service.handleStatusCommand(ROOM_ID);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toEqual(
        "<p>The bot is a moderator in the room <a href='originalRoomId'></a>. If you enter the command <code>!meeting setup</code> NeoDateFix widget will be added to that room.</p>",
      );
    });

    it('commands - StatusCommand - widget exists in the public room', async () => {
      when(
        meetingClientMock.fetchRoomAsync(privateRoomMarkerEvent.originalRoomId),
      ).thenResolve(
        new Room(privateRoomMarkerEvent.originalRoomId, [
          createPowerLevelsEvent(100),
          createWidgetEvent(),
        ]),
      );
      await service.handleStatusCommand(ROOM_ID);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toEqual(
        '<p><p>My job is done.</p><p>The calendar is already successfully installed into your room. You can leave this private chat-room.</p></p>',
      );
    });

    it('commands - StatusCommand - bot is not admin in the originalRoom', async () => {
      await service.handleStatusCommand(ROOM_ID);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toMatch(/The bot is not a moderator in the room/);
      expect(txt).not.toMatch(/My job is done/);
    });

    it('commands - SetupCommand - add widget', async () => {
      setBotPowerlevelInRoom(privateRoomMarkerEvent.originalRoomId, 100);
      await service.handleAddWidgetCommand(ROOM_ID);

      // verify add widget
      verify(
        clientMock.sendStateEvent(
          privateRoomMarkerEvent.originalRoomId,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
          anything(),
          anything(),
        ),
      ).once();

      const content = captureSendStateEvent(
        clientMock,
        0,
        SendStateEventParameter.Content,
        StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      );
      const state_key = captureSendStateEvent(
        clientMock,
        0,
        SendStateEventParameter.StateKey,
        StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      );
      expect(content.id).toBe(state_key); // widget content.id === state_key

      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toEqual(
        '<p>My job is done.</p><p>The calendar is already successfully installed into your room. You can leave this private chat-room.</p>',
      );
    });

    it('commands - SetupCommand - meeting widget already exists -> error', async () => {
      resetCalls(clientMock);
      when(
        meetingClientMock.fetchRoomAsync(privateRoomMarkerEvent.originalRoomId),
      ).thenResolve(
        new Room(privateRoomMarkerEvent.originalRoomId, [
          createPowerLevelsEvent(100),
          createWidgetEvent(),
        ]),
      );
      await service.handleAddWidgetCommand(ROOM_ID);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toEqual("Can't add a new widget because it already exists.");
    });

    it('commands - SetupCommand - bot is not an admin -> error', async () => {
      resetCalls(clientMock);
      await service.handleAddWidgetCommand(ROOM_ID);
      verify(clientMock.sendHtmlText(ROOM_ID, anyString())).once();
      const txt = captureSendHtmlText();
      expect(txt).toMatch(
        /Unfortunately, I cannot add the calendar function. I don't have the right authorisation./,
      );
    });
  });
});
