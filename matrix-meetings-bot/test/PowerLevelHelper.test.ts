/*
 * Copyright 2026 Nordeck IT + Consulting GmbH
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

import { PowerLevelsEventContent } from 'matrix-bot-sdk';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import { PermissionError } from '../src/error/PermissionError';
import { iStateEventHelper } from '../src/matrix/event/IStateEvent';
import { powerLevelHelper } from '../src/model/PowerLevelHelper';
import { Room } from '../src/model/Room';
import { RoomEventName } from '../src/model/RoomEventName';
import { StateEventName } from '../src/model/StateEventName';

const creator = '@creator:matrix.org';
const moderator = '@moderator:matrix.org';
const user = '@user:matrix.org';

function createRoom(powerLevels: PowerLevelsEventContent = {}): Room {
  return new Room('!room', [
    iStateEventHelper.fromPartial({
      type: StateEventName.M_ROOM_CREATION_EVENT,
      sender: creator,
      state_key: '',
      content: { room_version: '11', creator },
    }),
    iStateEventHelper.fromPartial({
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      sender: creator,
      state_key: '',
      content: {
        users: { [moderator]: 50 },
        users_default: 0,
        ...powerLevels,
      },
    }),
  ]);
}

describe('PowerLevelHelper', () => {
  test('should use state_default for state events and events_default for room events', () => {
    const room = createRoom({ state_default: 60, events_default: 40 });

    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        moderator,
        StateEventName.M_ROOM_NAME_EVENT,
      ),
    ).toBe(false);
    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        moderator,
        RoomEventName.M_ROOM_MESSAGE,
      ),
    ).toBe(true);
  });

  describe('userHasPowerLevelForAction', () => {
    test.each([
      [PowerLevelAction.Ban, 'ban'],
      [PowerLevelAction.Invite, 'invite'],
      [PowerLevelAction.Kick, 'kick'],
      [PowerLevelAction.RedactEvents, 'redact'],
    ])(
      'should require the power level from the power levels for %s',
      (action, key) => {
        const room = createRoom({ [key]: 50 });

        expect(
          powerLevelHelper.userHasPowerLevelForAction(room, moderator, action),
        ).toBe(true);
        expect(
          powerLevelHelper.userHasPowerLevelForAction(room, user, action),
        ).toBe(false);
      },
    );

    test('should not support room notifications', () => {
      const room = createRoom();

      expect(
        powerLevelHelper.userHasPowerLevelForAction(
          room,
          moderator,
          PowerLevelAction.NotifyRoom,
        ),
      ).toBe(false);
    });
  });

  describe('assertions', () => {
    test('should throw a PermissionError if the user lacks the power level for an event', () => {
      const room = createRoom();

      expect(() =>
        powerLevelHelper.assertUserHasPowerLevelFor(
          room,
          user,
          RoomEventName.M_ROOM_MESSAGE,
          StateEventName.M_ROOM_NAME_EVENT,
        ),
      ).toThrow(
        new PermissionError(
          `user: ${user} has no permission for event: m.room.name in room: !room`,
        ),
      );
    });

    test('should throw a PermissionError if the user lacks the power level for an action', () => {
      const room = createRoom();

      expect(() =>
        powerLevelHelper.assertUserHasPowerLevelForAction(
          room,
          user,
          PowerLevelAction.Kick,
        ),
      ).toThrow(
        new PermissionError(
          `user: ${user} has no permission for action: kick in room: !room`,
        ),
      );
    });
  });

  test('should deny all events and actions if the room has no power levels', () => {
    const room = new Room('!room', []);

    expect(
      powerLevelHelper.userHasPowerLevelFor(
        room,
        user,
        RoomEventName.M_ROOM_MESSAGE,
      ),
    ).toBe(false);
    expect(
      powerLevelHelper.userHasPowerLevelForAction(
        room,
        user,
        PowerLevelAction.Invite,
      ),
    ).toBe(false);
  });
});
