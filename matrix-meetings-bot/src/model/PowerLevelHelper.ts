/*
 * Copyright 2022-2026 Nordeck IT + Consulting GmbH
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
  calculateUserPowerLevel,
  hasActionPower,
  hasRoomEventPower,
  hasStateEventPower,
  PowerLevelsActions,
  PowerLevelsStateEvent,
  ROOM_VERSION_12_CREATOR,
  StateEvent,
  StateEventCreateContent,
} from '@matrix-widget-toolkit/api';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import { PermissionError } from '../error/PermissionError';
import { eventTypeHelper } from './EventTypeHelper';
import { IRoom } from './IRoom';
import { RoomEventName } from './RoomEventName';
import { StateEventName } from './StateEventName';

const toolkitActions: Record<PowerLevelAction, PowerLevelsActions | undefined> =
  {
    [PowerLevelAction.Ban]: 'ban',
    [PowerLevelAction.Invite]: 'invite',
    [PowerLevelAction.Kick]: 'kick',
    [PowerLevelAction.RedactEvents]: 'redact',
    [PowerLevelAction.NotifyRoom]: undefined,
  };

export class PowerLevelHelper {
  public assertUserHasPowerLevelFor(
    room: IRoom,
    userId: string,
    ...eventTypes: (StateEventName | RoomEventName)[]
  ) {
    for (const eventType of eventTypes) {
      if (!powerLevelHelper.userHasPowerLevelFor(room, userId, eventType)) {
        throw new PermissionError(
          `user: ${userId} has no permission for event: ${eventType} in room: ${room.id}`,
        );
      }
    }
  }

  public assertUserHasPowerLevelForAction(
    room: IRoom,
    userId: string,
    action: PowerLevelAction,
  ) {
    if (!powerLevelHelper.userHasPowerLevelForAction(room, userId, action)) {
      throw new PermissionError(
        `user: ${userId} has no permission for action: ${action} in room: ${room.id}`,
      );
    }
  }

  /**
   * Checks if a given user has the power level required to send the given event.
   * @param {IRoom} room room
   * @param {string} userId the user ID to check the power level of
   * @param {string} eventType the type of the state or room event
   * @returns {boolean} true if the user has the required power level, false otherwise
   */
  public userHasPowerLevelFor(
    room: IRoom,
    userId: string,
    eventType: StateEventName | RoomEventName,
  ): boolean {
    const powerLevels = getPowerLevels(room);
    if (!powerLevels) {
      // This is technically supposed to be non-fatal, but it's pretty unreasonable for a room to be missing
      // power levels.
      return false;
    }

    return eventTypeHelper.isState(eventType)
      ? hasStateEventPower(powerLevels, getCreateEvent(room), userId, eventType)
      : hasRoomEventPower(powerLevels, getCreateEvent(room), userId, eventType);
  }

  /**
   * Checks if a given user has the power level required to perform the given action.
   * @param {IRoom} room room
   * @param {string} userId the user ID to check the power level of
   * @param {PowerLevelAction} action the action to check the power level for
   * @returns {boolean} true if the user has the required power level, false otherwise
   */
  public userHasPowerLevelForAction(
    room: IRoom,
    userId: string,
    action: PowerLevelAction,
  ): boolean {
    const powerLevels = getPowerLevels(room);
    const toolkitAction = toolkitActions[action];
    if (!powerLevels || !toolkitAction) {
      return false;
    }

    return hasActionPower(
      powerLevels,
      getCreateEvent(room),
      userId,
      toolkitAction,
    );
  }

  /**
   * Calculates the power level of a user in a room. The room creators of room
   * version 12 have an infinite power level.
   * @param {IRoom} room room
   * @param {string} userId the user ID to calculate the power level of
   * @returns {number} the power level of the user
   */
  public calculateUserPowerLevel(room: IRoom, userId: string): number {
    const powerLevel = calculateUserPowerLevel(
      getPowerLevels(room),
      getCreateEvent(room),
      userId,
    );

    return powerLevel === ROOM_VERSION_12_CREATOR
      ? Number.POSITIVE_INFINITY
      : powerLevel;
  }
}

function getPowerLevels(room: IRoom): PowerLevelsStateEvent | undefined {
  return room.roomEventsByName(StateEventName.M_ROOM_POWER_LEVELS_EVENT)[0]
    ?.content as PowerLevelsStateEvent | undefined;
}

function getCreateEvent(
  room: IRoom,
): StateEvent<StateEventCreateContent> | undefined {
  return room.roomEventsByName(StateEventName.M_ROOM_CREATION_EVENT)[0] as
    | StateEvent<StateEventCreateContent>
    | undefined;
}

export const powerLevelHelper = new PowerLevelHelper();
