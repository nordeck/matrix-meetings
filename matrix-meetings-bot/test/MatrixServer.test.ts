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

import { MessageHandler } from '@nestjs/microservices';
import {
  MatrixClient,
  MembershipEvent,
  MembershipEventContent,
} from 'matrix-bot-sdk';
import { PinoLogger } from 'nestjs-pino';
import { default as pino } from 'pino';
import { Observable } from 'rxjs';
import { anything, instance, mock, verify, when } from 'ts-mockito';
import { AppRuntimeContext } from '../src/AppRuntimeContext';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { ReactionClient } from '../src/client/ReactionClient';
import { MeetingCreateDto } from '../src/dto/MeetingCreateDto';
import { ParticipantDto } from '../src/dto/ParticipantDto';
import { BotEventType } from '../src/matrix/BotEventType';
import { IBotEventContent } from '../src/matrix/event/IBotEventContent';
import { IRoomEvent } from '../src/matrix/event/IRoomEvent';
import { IStateEvent } from '../src/matrix/event/IStateEvent';
import { RoomEventName } from '../src/model/RoomEventName';
import { StateEventName } from '../src/model/StateEventName';
import { matrixPattern } from '../src/rpc/IMatrixPattern';
import {
  IHandlerArguments,
  MatrixServer,
  NET_NORDECK_MEETINGS,
} from '../src/rpc/MatrixServer';
import { RoomMessageService } from '../src/service/RoomMessageService';

describe('MatrixServer suite', () => {
  let matrixClientMock: MatrixClient;
  let matrixClient: MatrixClient;
  let matrixServer: MatrixServer;

  const sender = '@bot:matrix.org';
  const roomId = '!a1';
  const matrix_server_event_max_age_minutes = 1;

  const roomEvent = (matrixEventType: string): IRoomEvent<unknown> => {
    return {
      sender,
      type: matrixEventType,
      content: {},
      event_id: 'event_id1',
      origin_server_ts: 0,
    };
  };

  beforeEach(() => {
    const appRuntimeContext: AppRuntimeContext = {
      botUserId: sender,
      displayName: '',
      localpart: '',
      supportedLngs: [],
    };
    matrixClientMock = mock(MatrixClient);
    matrixClient = instance(matrixClientMock);
    const reactionClient: ReactionClient = mock(ReactionClient);
    const roomMessageService: RoomMessageService = mock(RoomMessageService);
    let appConfiguration = {} as unknown as IAppConfiguration;
    appConfiguration = {
      ...appConfiguration,
      matrix_server_event_max_age_minutes,
    };
    // @ts-expect-error: root is readonly field, but this is the place where
    // it's set actually
    PinoLogger.root = pino();
    matrixServer = new MatrixServer(
      appRuntimeContext,
      matrixClient,
      reactionClient,
      roomMessageService,
      appConfiguration,
    );
  });

  afterEach(() => {
    // @ts-expect-error: root is readonly field, but this is the place where
    // it's set actually
    PinoLogger.root = undefined;
  });

  test('onModuleInit test', async () => {
    await matrixServer.onModuleInit();
    verify(matrixClientMock.start(anything())).once();
  });

  test('onModuleInit when bot has no avatar', async () => {
    when(matrixClientMock.getUserProfile(anything())).thenResolve({});
    await matrixServer.onModuleInit();
    verify(matrixClientMock.start(anything())).once();
  });

  test('onModuleInit when bot has an avatar', async () => {
    when(matrixClientMock.getUserProfile(anything())).thenResolve({
      avatar_url: 'avatar_url',
    });
    await matrixServer.onModuleInit();
    verify(matrixClientMock.start(anything())).once();
    verify(matrixClientMock.setAvatarUrl(anything())).never();
  });

  test('onApplicationShutdown test', async () => {
    await matrixServer.onApplicationShutdown();
    verify(matrixClientMock.stop()).once();
  });

  test('addHandler/processEvent Bot NIC custom room event test', async () => {
    await matrixServer.onModuleInit();

    let count = 0;
    const handler: MessageHandler = (): Promise<Observable<any>> => {
      count += 1;
      return Promise.resolve(undefined as any);
    };

    const pattern = matrixPattern.roomEvent(
      RoomEventName.NIC_MEETINGS_MEETING_CREATE,
    );
    matrixServer.addHandler(pattern, handler, true);

    expect(
      matrixServer.getHandlerByPattern(matrixServer.normalizePattern(pattern)),
    ).toBe(handler);

    /**
     * case 1: bot is started, there is a room that bot joined before
     */

    // simple state event stub
    const roomStateEvent: IRoomEvent<unknown> = {
      ...roomEvent(StateEventName.M_ROOM_NAME_EVENT),
      origin_server_ts: new Date(Date.now() + 1000).getTime(),
    };
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomStateEvent,
    );
    verify(matrixClientMock.getRoomMembers(roomId)).never(); // normal state event should not trigger room state loading

    // bot member join event for the joined room
    const botMemberJoinEvent: IStateEvent<MembershipEventContent> = {
      event_id: 'e1',
      origin_server_ts: Date.now(),
      sender,
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: sender,
    };
    when(matrixClientMock.getRoomMembers(roomId)).thenResolve([
      new MembershipEvent(botMemberJoinEvent),
    ]);

    // create meeting event before bot has joined the room
    const roomEvent1: IRoomEvent<unknown> = {
      ...roomEvent(RoomEventName.NIC_MEETINGS_MEETING_CREATE),
      origin_server_ts: new Date(Date.now() - 1000).getTime(),
    };
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomEvent1,
    );
    expect(count).toBe(0); // event before membership must be ignored
    verify(matrixClientMock.getRoomMembers(roomId)).times(1);

    // create meeting event after bot has joined the room
    const roomEvent2: IRoomEvent<unknown> = {
      ...roomEvent(pattern.matrixEventType),
      origin_server_ts: new Date(Date.now() + 1000).getTime(),
    };
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomEvent2,
    );
    expect(count).toBe(1); // event after membership must be processed
    verify(matrixClientMock.getRoomMembers(roomId)).times(1); // no room state loading

    /**
     * case 2: bot is kicked and then invited to this room again
     */

    await matrixServer.processEvent(
      BotEventType.ROOM_LEAVE,
      roomId,
      roomEvent(StateEventName.M_ROOM_MEMBER_EVENT),
    );

    const botMemberInviteEvent: IStateEvent<MembershipEventContent> = {
      event_id: 'e1',
      origin_server_ts: new Date(Date.now() + 2000).getTime(),
      sender: '@some_user',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'invite',
      },
      state_key: sender,
    };
    await matrixServer.processEvent(
      BotEventType.ROOM_INVITE,
      roomId,
      botMemberInviteEvent,
    );

    // synapse sends events after invite

    // old event, to be ignored
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomEvent1,
    );
    verify(matrixClientMock.getRoomMembers(roomId)).times(1); // no room state loading, origin_server_ts is taken from invite event sent before
    expect(count).toBe(1); // event is skipped because it is old

    // old event, to be ignored
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomEvent2,
    );
    verify(matrixClientMock.getRoomMembers(roomId)).times(1); // no room state loading, origin_server_ts is taken from invite event sent before
    expect(count).toBe(1); // event is skipped because it is old

    //
    const roomEvent3: IRoomEvent<unknown> = {
      ...roomEvent(pattern.matrixEventType),
      origin_server_ts: new Date(Date.now() + 3000).getTime(),
    };
    await matrixServer.processEvent(
      BotEventType.ROOM_EVENT,
      roomId,
      roomEvent3,
    );
    expect(count).toBe(2); // event must be processed because it is after invite
    verify(matrixClientMock.getRoomMembers(roomId)).times(1); // no room state loading, origin_server_ts is taken from invite event sent before
  });

  test('addHandler/processEvent test', async () => {
    await matrixServer.onModuleInit();

    let count = 0;
    const handler: MessageHandler = (): Promise<Observable<any>> => {
      count += 1;
      return Promise.resolve(undefined as any);
    };

    const pattern = matrixPattern.roomEvent(StateEventName.M_ROOM_MEMBER_EVENT);
    matrixServer.addHandler(pattern, handler, true);
    const otherPattern = matrixPattern.roomEvent(
      StateEventName.M_ROOM_NAME_EVENT,
    );

    expect(
      matrixServer.getHandlerByPattern(matrixServer.normalizePattern(pattern)),
    ).toBe(handler);
    expect(
      matrixServer.getHandlerByPattern(
        matrixServer.normalizePattern(otherPattern),
      ),
    ).toBeNull();

    const roomEvent1 = {
      ...roomEvent(pattern.matrixEventType),
      origin_server_ts: 0, // explicitly set old value
    };
    await matrixServer.processEvent(pattern.botEventType, roomId, roomEvent1);
    expect(count).toBe(0);

    const roomEvent2 = {
      ...roomEvent(pattern.matrixEventType),
      origin_server_ts: Date.now(), //event happened just now
    };
    await matrixServer.processEvent(pattern.botEventType, roomId, roomEvent2);
    expect(count).toBe(1);

    const handler1: MessageHandler = (): Promise<Observable<any>> => {
      throw new Error();
    };
    const pattern1 = matrixPattern.roomEvent(
      StateEventName.M_ROOM_POWER_LEVELS_EVENT,
    );
    matrixServer.addHandler(pattern1, handler1, true);

    const roomEvent11 = {
      ...roomEvent(pattern1.matrixEventType),
      origin_server_ts: Date.now(), //event happened just now
    };
    await expect(
      matrixServer.processEvent(pattern1.botEventType, roomId, roomEvent11),
    ).rejects.toThrowError();
  });

  test('listen/close test', async () => {
    const count = Object.values(BotEventType).length;

    matrixServer.listen(() => {
      // empty
    });
    verify(matrixClientMock.on(anything(), anything())).times(count);
    expect(matrixServer.subscribersLength()).toBe(count);

    matrixServer.close();
    verify(matrixClientMock.off(anything(), anything())).times(count);
  });

  test('extractHandlerArguments test', async () => {
    const createMeetingContent: IBotEventContent<MeetingCreateDto> = {
      context: {
        locale: 'en',
        timezone: 'UTC',
        userId: '@user:matrix.org',
      },
      data: {
        title: 'aa1',
        description: 'Child of a1',
        start_time: '2022-01-01T01:00:00.000Z',
        end_time: '2022-01-01T02:00:00.000Z',
        participants: [new ParticipantDto('@user:matrix.org', undefined)],
        enable_auto_deletion: true,
      },
    };

    let args: IHandlerArguments;

    const event: IRoomEvent<unknown> = {
      sender,
      type: RoomEventName.NIC_MEETINGS_MEETING_CREATE,
      content: createMeetingContent,
      event_id: 'someId1',
      origin_server_ts: 0,
    };
    args = matrixServer.extractHandlerArguments(
      BotEventType.ROOM_EVENT,
      roomId,
      event,
    );

    expect(args.data).toStrictEqual(createMeetingContent.data); // data should be taken from bot event content
    expect(args.context?.userContext.requestId).toBe('someId1'); // context should be defined with requestId equal event_id

    const specialCases: [BotEventType, string][] = [
      [BotEventType.ROOM_EVENT, 'net.other_event_namespace'],
      [BotEventType.ROOM_INVITE, NET_NORDECK_MEETINGS],
    ];
    for (const [botEventType, matrixEventType] of specialCases) {
      const stubEvent: IRoomEvent<unknown> = roomEvent(matrixEventType);
      args = matrixServer.extractHandlerArguments(
        botEventType,
        roomId,
        stubEvent,
      );

      expect(args.data).toStrictEqual(stubEvent); // event is data for handler
      expect(args.context?.roomId).toEqual(roomId); // context contains at least the roomId
    }
  });
});
