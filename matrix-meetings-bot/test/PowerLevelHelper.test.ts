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
const additionalCreator = '@additional-creator:matrix.org';
const moderator = '@moderator:matrix.org';
const user = '@user:matrix.org';

function createRoom({
  roomVersion,
  additionalCreators,
  powerLevels = {},
}: {
  roomVersion?: string;
  additionalCreators?: string[];
  powerLevels?: PowerLevelsEventContent;
}): Room {
  return new Room('!room', [
    iStateEventHelper.fromPartial({
      type: StateEventName.M_ROOM_CREATION_EVENT,
      sender: creator,
      state_key: '',
      content: {
        room_version: roomVersion,
        creator,
        additional_creators: additionalCreators,
      },
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
  describe.each([['11'], ['12']])(
    'PL for users in room version %s',
    (roomVersion) => {
      describe('calculateUserPowerLevel', () => {
        test('should return the power level of a listed user', () => {
          const room = createRoom({ roomVersion });

          expect(
            powerLevelHelper.calculateUserPowerLevel(room, moderator),
          ).toBe(50);
        });

        test('should return users_default for a user that is not listed', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: { users_default: 10 },
          });

          expect(powerLevelHelper.calculateUserPowerLevel(room, user)).toBe(10);
        });

        test('should return 0 if users_default is missing', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: { users_default: undefined },
          });

          expect(powerLevelHelper.calculateUserPowerLevel(room, user)).toBe(0);
        });
      });

      describe('userHasPowerLevelFor state events', () => {
        test('should require the power level from events', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: {
              state_default: 100,
              events: { [StateEventName.M_ROOM_NAME_EVENT]: 50 },
            },
          });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              moderator,
              StateEventName.M_ROOM_NAME_EVENT,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              user,
              StateEventName.M_ROOM_NAME_EVENT,
            ),
          ).toBe(false);
        });

        test('should require state_default if the event is not in events', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: { state_default: 60 },
          });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              moderator,
              StateEventName.M_SPACE_CHILD_EVENT,
            ),
          ).toBe(false);
        });

        test('should require 50 if state_default is missing', () => {
          const room = createRoom({ roomVersion });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              moderator,
              StateEventName.M_SPACE_CHILD_EVENT,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              user,
              StateEventName.M_SPACE_CHILD_EVENT,
            ),
          ).toBe(false);
        });
      });

      describe('userHasPowerLevelFor room events', () => {
        test('should require the power level from events', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: {
              events_default: 0,
              events: { [RoomEventName.M_ROOM_MESSAGE]: 50 },
            },
          });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              moderator,
              RoomEventName.M_ROOM_MESSAGE,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              user,
              RoomEventName.M_ROOM_MESSAGE,
            ),
          ).toBe(false);
        });

        test('should require events_default if the event is not in events', () => {
          const room = createRoom({
            roomVersion,
            powerLevels: { events_default: 60 },
          });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              moderator,
              RoomEventName.M_ROOM_MESSAGE,
            ),
          ).toBe(false);
        });

        test('should require 0 if events_default is missing', () => {
          const room = createRoom({ roomVersion });

          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              user,
              RoomEventName.M_ROOM_MESSAGE,
            ),
          ).toBe(true);
        });
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
            const room = createRoom({
              roomVersion,
              powerLevels: { [key]: 50 },
            });

            expect(
              powerLevelHelper.userHasPowerLevelForAction(
                room,
                moderator,
                action,
              ),
            ).toBe(true);
            expect(
              powerLevelHelper.userHasPowerLevelForAction(room, user, action),
            ).toBe(false);
          },
        );

        test.each([
          [PowerLevelAction.Ban],
          [PowerLevelAction.Kick],
          [PowerLevelAction.RedactEvents],
        ])('should require 50 for %s if it is missing', (action) => {
          const room = createRoom({ roomVersion });

          expect(
            powerLevelHelper.userHasPowerLevelForAction(
              room,
              moderator,
              action,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelForAction(room, user, action),
          ).toBe(false);
        });

        test('should require 0 for invite if it is missing', () => {
          const room = createRoom({ roomVersion });

          expect(
            powerLevelHelper.userHasPowerLevelForAction(
              room,
              user,
              PowerLevelAction.Invite,
            ),
          ).toBe(true);
        });

        test('should not support room notifications', () => {
          const room = createRoom({ roomVersion });

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
          const room = createRoom({ roomVersion });

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
          const room = createRoom({ roomVersion });

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

        test('should not throw if the user has the power level', () => {
          const room = createRoom({ roomVersion });

          expect(() =>
            powerLevelHelper.assertUserHasPowerLevelFor(
              room,
              moderator,
              RoomEventName.M_ROOM_MESSAGE,
              StateEventName.M_ROOM_NAME_EVENT,
            ),
          ).not.toThrow();
          expect(() =>
            powerLevelHelper.assertUserHasPowerLevelForAction(
              room,
              moderator,
              PowerLevelAction.Kick,
            ),
          ).not.toThrow();
        });
      });
    },
  );

  describe('room creators before room version 12', () => {
    test.each([['11'], [undefined]])(
      'should use the power levels for the creators in room version %s',
      (roomVersion) => {
        const room = createRoom({
          roomVersion,
          additionalCreators: [additionalCreator],
        });

        expect(powerLevelHelper.calculateUserPowerLevel(room, creator)).toBe(0);
        expect(
          powerLevelHelper.calculateUserPowerLevel(room, additionalCreator),
        ).toBe(0);
        expect(
          powerLevelHelper.userHasPowerLevelFor(
            room,
            creator,
            StateEventName.M_SPACE_CHILD_EVENT,
          ),
        ).toBe(false);
      },
    );

    test('should use the power level of a listed creator', () => {
      const room = createRoom({
        roomVersion: '11',
        powerLevels: { users: { [creator]: 100 } },
      });

      expect(powerLevelHelper.calculateUserPowerLevel(room, creator)).toBe(100);
    });

    test('should require the power level from the power levels for tombstone events', () => {
      const room = createRoom({
        roomVersion: '11',
        powerLevels: {
          events: { [StateEventName.M_ROOM_TOMBSTONE_EVENT]: 50 },
        },
      });

      expect(
        powerLevelHelper.userHasPowerLevelFor(
          room,
          moderator,
          StateEventName.M_ROOM_TOMBSTONE_EVENT,
        ),
      ).toBe(true);
    });
  });

  describe.each([['12'], ['org.matrix.hydra.11']])(
    'room creators in room version %s',
    (roomVersion) => {
      test('should give the creator an infinite power level', () => {
        const room = createRoom({ roomVersion });

        expect(powerLevelHelper.calculateUserPowerLevel(room, creator)).toBe(
          Number.POSITIVE_INFINITY,
        );
      });

      test('should give additional creators an infinite power level', () => {
        const room = createRoom({
          roomVersion,
          additionalCreators: [additionalCreator],
        });

        expect(
          powerLevelHelper.calculateUserPowerLevel(room, additionalCreator),
        ).toBe(Number.POSITIVE_INFINITY);
      });

      test('should allow the creators all events and actions', () => {
        const room = createRoom({
          roomVersion,
          additionalCreators: [additionalCreator],
          powerLevels: {
            state_default: 100,
            events_default: 100,
            kick: 100,
          },
        });

        for (const userId of [creator, additionalCreator]) {
          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              userId,
              StateEventName.M_SPACE_CHILD_EVENT,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelFor(
              room,
              userId,
              RoomEventName.M_ROOM_MESSAGE,
            ),
          ).toBe(true);
          expect(
            powerLevelHelper.userHasPowerLevelForAction(
              room,
              userId,
              PowerLevelAction.Kick,
            ),
          ).toBe(true);
        }
      });

      test('should rank the creators above all other users', () => {
        const room = createRoom({
          roomVersion,
          powerLevels: { users: { [moderator]: 150 } },
        });

        expect(
          powerLevelHelper.calculateUserPowerLevel(room, moderator),
        ).toBeLessThan(powerLevelHelper.calculateUserPowerLevel(room, creator));
      });

      test('should require 150 for tombstone events, regardless of the power levels', () => {
        const room = createRoom({
          roomVersion,
          powerLevels: {
            users: { [moderator]: 100 },
            events: { [StateEventName.M_ROOM_TOMBSTONE_EVENT]: 50 },
          },
        });

        expect(
          powerLevelHelper.userHasPowerLevelFor(
            room,
            moderator,
            StateEventName.M_ROOM_TOMBSTONE_EVENT,
          ),
        ).toBe(false);
        expect(
          powerLevelHelper.userHasPowerLevelFor(
            createRoom({
              roomVersion,
              powerLevels: { users: { [moderator]: 150 } },
            }),
            moderator,
            StateEventName.M_ROOM_TOMBSTONE_EVENT,
          ),
        ).toBe(true);
      });
    },
  );

  test('should not give the creators extra power in unknown room versions', () => {
    const room = createRoom({ roomVersion: 'org.example.unstable' });

    expect(powerLevelHelper.calculateUserPowerLevel(room, creator)).toBe(0);
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
