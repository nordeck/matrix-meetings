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
  compareUserPowerLevelToNormalPowerLevel,
  hasActionPower,
  hasRoomEventPower,
  hasStateEventPower,
  PowerLevelsActions,
  ROOM_VERSION_12_CREATOR,
  StateEvent,
  StateEventCreateContent,
} from '@matrix-widget-toolkit/api';
import { PowerLevelsEventContent } from 'matrix-bot-sdk';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import { PermissionError } from '../error/PermissionError';
import { ICreationContent } from '../matrix/dto/ICreationContent';
import { IStateEvent } from '../matrix/event/IStateEvent';
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

/**
 * Converts the create event to the type of @matrix-widget-toolkit/api. This
 * file is the only place that uses the toolkit, so it can be replaced easily.
 * The toolkit only reads the `sender` and the `content` of the event.
 */
function toToolkitCreateEvent(
  createEvent: IStateEvent<ICreationContent> | undefined,
): StateEvent<StateEventCreateContent> | undefined {
  return createEvent as unknown as
    | StateEvent<StateEventCreateContent>
    | undefined;
}

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
    return this.userHasPowerLevelForEvent(
      room.powerLevelContent,
      room.createEvent,
      userId,
      eventType,
    );
  }

  /**
   * Checks if a given user has the power level required to send the given
   * event, based on the given power levels instead of the ones of a room.
   * @param {PowerLevelsEventContent | undefined} powerLevels the content of the power levels event
   * @param {IStateEvent<ICreationContent> | undefined} createEvent the create event of the room
   * @param {string} userId the user ID to check the power level of
   * @param {string} eventType the type of the state or room event
   * @returns {boolean} true if the user has the required power level, false otherwise
   */
  public userHasPowerLevelForEvent(
    powerLevels: PowerLevelsEventContent | undefined,
    createEvent: IStateEvent<ICreationContent> | undefined,
    userId: string,
    eventType: StateEventName | RoomEventName,
  ): boolean {
    if (!powerLevels) {
      // This is technically supposed to be non-fatal, but it's pretty unreasonable for a room to be missing
      // power levels.
      return false;
    }

    const toolkitCreateEvent = toToolkitCreateEvent(createEvent);
    return eventTypeHelper.isState(eventType)
      ? hasStateEventPower(powerLevels, toolkitCreateEvent, userId, eventType)
      : hasRoomEventPower(powerLevels, toolkitCreateEvent, userId, eventType);
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

    return hasActionPower(
      powerLevels,
      toToolkitCreateEvent(room.createEvent),
      userId,
      toolkitAction,
    );
  }

  /**
   * Finds a user whose power level is greater than or equal to the power level
   * of a given user. Room version 12 creators are only matched by other
   * creators.
   * @param {IRoom} room room
   * @param {string} userId the user ID to compare the power levels to
   * @param {string[]} userIds the user IDs to search
   * @returns {string | undefined} the first matching user ID, or undefined if there is none
   */
  public findUserWithEqualOrHigherPowerLevel(
    room: IRoom,
    userId: string,
    userIds: string[],
  ): string | undefined {
    const createEvent = toToolkitCreateEvent(room.createEvent);
    const userPowerLevel = calculateUserPowerLevel(
      room.powerLevelContent,
      createEvent,
      userId,
    );

    return userIds.find((otherUserId) => {
      const otherUserPowerLevel = calculateUserPowerLevel(
        room.powerLevelContent,
        createEvent,
        otherUserId,
      );
      if (userPowerLevel === ROOM_VERSION_12_CREATOR) {
        return otherUserPowerLevel === ROOM_VERSION_12_CREATOR;
      }
      return compareUserPowerLevelToNormalPowerLevel(
        otherUserPowerLevel,
        userPowerLevel,
      );
    });
  }
}

export const powerLevelHelper = new PowerLevelHelper();
