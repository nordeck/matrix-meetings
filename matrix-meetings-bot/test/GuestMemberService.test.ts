/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
  MembershipEventContent,
  PowerLevelsEventContent,
} from 'matrix-bot-sdk';
import { capture, instance, mock, when } from 'ts-mockito';
import { AppRuntimeContext } from '../src/AppRuntimeContext';
import { IAppConfiguration } from '../src/IAppConfiguration';
import { IStateEvent } from '../src/matrix/event/IStateEvent';
import { StateEventName } from '../src/model/StateEventName';
import { GuestMemberService } from '../src/service/GuestMemberService';
import { createAppConfig, getArgsFromCaptor } from './util/MockUtils';

describe('GuestMemberService', () => {
  const botUserId = '@bot:matrix.org';
  const roomId = '!roomId1';

  const appRuntimeContext: AppRuntimeContext = {
    botUserId,
    displayName: '',
    localpart: '',
    supportedLngs: [],
  };

  let appConfig: IAppConfiguration;

  let matrixClientMock: MatrixClient;
  let matrixClient: MatrixClient;
  let guestMemberService: GuestMemberService;

  beforeEach(() => {
    appConfig = {
      ...createAppConfig(),
      enable_guest_user_power_level_change: true,
    };

    matrixClientMock = mock(MatrixClient);
    matrixClient = instance(matrixClientMock);
    guestMemberService = new GuestMemberService(
      appRuntimeContext,
      appConfig,
      matrixClient,
    );
  });

  test.each([50, 100, 101])(
    'assigns power level to guest when guest joins and bot has power (power level: %s)',
    async (botPowerLevel) => {
      when(
        matrixClientMock.getRoomStateEvent(
          roomId,
          StateEventName.M_ROOM_POWER_LEVELS_EVENT,
          '',
        ),
      ).thenResolve({
        users: {
          [botUserId]: botPowerLevel,
        },
        users_default: 25,
        events: {},
        events_default: 0,
        state_default: 50,
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 0,
      } satisfies PowerLevelsEventContent);

      const memberEvent: IStateEvent<MembershipEventContent> = {
        event_id: '$eventId1',
        origin_server_ts: Date.now(),
        sender: '@guest-userId1:matrix.org',
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        content: {
          membership: 'join',
        },
        state_key: '@guest-userId1:matrix.org',
      };
      await guestMemberService.processMember(roomId, memberEvent);

      expect(
        getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
          ([, , , content]) => content,
        ),
      ).toEqual([
        {
          users: {
            [botUserId]: botPowerLevel,
            '@guest-userId1:matrix.org': 0,
          },
          users_default: 25,
          events: {},
          events_default: 0,
          state_default: 50,
          ban: 50,
          kick: 50,
          redact: 50,
          invite: 0,
        },
      ]);
    },
  );

  test.each([50, 100, 101])(
    'deletes power level of guest when guest leaves and bot has power (power level: %s)',
    async (botPowerLevel) => {
      when(
        matrixClientMock.getRoomStateEvent(
          roomId,
          StateEventName.M_ROOM_POWER_LEVELS_EVENT,
          '',
        ),
      ).thenResolve({
        users: {
          [botUserId]: botPowerLevel,
          '@guest-userId1:matrix.org': 0,
        },
        users_default: 25,
        events: {},
        events_default: 0,
        state_default: 50,
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 0,
      } satisfies PowerLevelsEventContent);

      const memberEvent: IStateEvent<MembershipEventContent> = {
        event_id: '$eventId1',
        origin_server_ts: Date.now(),
        sender: '@guest-userId1:matrix.org',
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        content: {
          membership: 'leave',
        },
        state_key: '@guest-userId1:matrix.org',
      };
      await guestMemberService.processMember(roomId, memberEvent);

      expect(
        getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
          ([, , , content]) => content,
        ),
      ).toEqual([
        {
          users: {
            [botUserId]: botPowerLevel,
          },
          users_default: 25,
          events: {},
          events_default: 0,
          state_default: 50,
          ban: 50,
          kick: 50,
          redact: 50,
          invite: 0,
        },
      ]);
    },
  );

  test('does not assign power level to guest when guest joins and bot has power but guest change power level is disabled', async () => {
    appConfig.enable_guest_user_power_level_change = false;

    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
      },
      users_default: 25,
      events: {},
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test('does not assign power level to guest when guest joins but no power level event', async () => {
    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenThrow(new Error('Event not found'));

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test('does not assign power level to guest when guest joins but bot has no power to change power level', async () => {
    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
      },
      users_default: 25,
      events: {
        'm.room.power_levels': 100,
      },
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test('does not delete power level of guest when guest leaves and bot has power but delete is disabled', async () => {
    appConfig.guest_user_delete_power_level_on_leave = false;

    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
        '@guest-userId1:matrix.org': 0,
      },
      users_default: 25,
      events: {},
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'leave',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test('does not assign power level to not a guest user when user joins and bot has power', async () => {
    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
      },
      users_default: 25,
      events: {},
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: '@userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test.each([0, 50])(
    'does not delete power level of not a guest user when user (power level: %s) leaves and bot has power',
    async (userPowerLevel) => {
      when(
        matrixClientMock.getRoomStateEvent(
          roomId,
          StateEventName.M_ROOM_POWER_LEVELS_EVENT,
          '',
        ),
      ).thenResolve({
        users: {
          [botUserId]: 50,
          '@userId1:matrix.org': userPowerLevel,
        },
        users_default: 25,
        events: {},
        events_default: 0,
        state_default: 50,
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 0,
      } satisfies PowerLevelsEventContent);

      const memberEvent: IStateEvent<MembershipEventContent> = {
        event_id: '$eventId1',
        origin_server_ts: Date.now(),
        sender: '@userId1:matrix.org',
        type: StateEventName.M_ROOM_MEMBER_EVENT,
        content: {
          membership: 'leave',
        },
        state_key: '@userId1:matrix.org',
      };
      await guestMemberService.processMember(roomId, memberEvent);

      expect(
        getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
          ([, , , content]) => content,
        ),
      ).toEqual([]);
    },
  );

  test('does not assign power level to guest when guest joins and bot has power but guest power level equals users_default', async () => {
    appConfig.guest_user_default_power_level = 25;

    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
      },
      users_default: 25,
      events: {},
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'join',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });

  test('does not delete power level of guest when guest leaves and bot has power but guest power level equals users_default', async () => {
    appConfig.guest_user_default_power_level = 25;

    when(
      matrixClientMock.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      ),
    ).thenResolve({
      users: {
        [botUserId]: 50,
        '@guest-userId1:matrix.org': 0,
      },
      users_default: 25,
      events: {},
      events_default: 0,
      state_default: 50,
      ban: 50,
      kick: 50,
      redact: 50,
      invite: 0,
    } satisfies PowerLevelsEventContent);

    const memberEvent: IStateEvent<MembershipEventContent> = {
      event_id: '$eventId1',
      origin_server_ts: Date.now(),
      sender: '@guest-userId1:matrix.org',
      type: StateEventName.M_ROOM_MEMBER_EVENT,
      content: {
        membership: 'leave',
      },
      state_key: '@guest-userId1:matrix.org',
    };
    await guestMemberService.processMember(roomId, memberEvent);

    expect(
      getArgsFromCaptor(capture(matrixClientMock.sendStateEvent)).map(
        ([, , , content]) => content,
      ),
    ).toEqual([]);
  });
});
