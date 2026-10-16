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
  hasActionPower,
  hasRoomEventPower,
  hasStateEventPower,
  PowerLevelsActions,
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
    const powerLevels = room.powerLevelContent;
    if (!powerLevels) {
      // This is technically supposed to be non-fatal, but it's pretty unreasonable for a room to be missing
      // power levels.
      return false;
    }

    return eventTypeHelper.isState(eventType)
      ? hasStateEventPower(powerLevels, room.createEvent, userId, eventType)
      : hasRoomEventPower(powerLevels, room.createEvent, userId, eventType);
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
    const powerLevels = room.powerLevelContent;
    const toolkitAction = toolkitActions[action];
    if (!powerLevels || !toolkitAction) {
      return false;
    }

    return hasActionPower(powerLevels, room.createEvent, userId, toolkitAction);
  }
}

export const powerLevelHelper = new PowerLevelHelper();
