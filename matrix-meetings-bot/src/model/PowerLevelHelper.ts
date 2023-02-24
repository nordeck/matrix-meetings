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

import { PowerLevelsEventContent } from 'matrix-bot-sdk';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import { PermissionError } from '../error/PermissionError';
import { eventTypeHelper } from './EventTypeHelper';
import { IRoom } from './IRoom';
import { RoomEventName } from './RoomEventName';
import { StateEventName } from './StateEventName';

export class PowerLevelHelper {
  public assertUserHasPowerLevelFor(
    room: IRoom,
    userId: string,
    ...eventTypes: (StateEventName | RoomEventName)[]
  ) {
    for (const eventType of eventTypes) {
      if (!powerLevelHelper.userHasPowerLevelFor(room, userId, eventType)) {
        throw new PermissionError(
          `user: ${userId} has no permission for event: ${eventType} in room: ${room.id}`
        );
      }
    }
  }

  public assertUserHasPowerLevelForAction(
    room: IRoom,
    userId: string,
    action: PowerLevelAction
  ) {
    if (!powerLevelHelper.userHasPowerLevelForAction(room, userId, action)) {
      throw new PermissionError(
        `user: ${userId} has no permission for action: ${action} in room: ${room.id}`
      );
    }
  }

  //------In the MatrixBot there are now 2 implementations one for actions one for events
  //------Copied the matrixBot-code, removed the async to avoid too much requests, because we have already the power_levels fetched for the room
  //------set isState to be optional parameter, if 'undefined' then will try to find isState value for passed eventType
  /**
   * Checks if a given user has a required power level required to send the given event.
   * @param {IRoom} room room
   * @param {string} userId the user ID to check the power level of
   * @param {string} eventType the event type to look for in the `events` property of the power levels
   * @param {boolean} isState true to indicate the event is intended to be a state event
   * @returns {Promise<boolean>} resolves to true if the user has the required power level, resolves to false otherwise
   */
  // TODO should we maybe use PowerLevelAction here too and switch on undefined to userHasPowerLevelForAction ?
  // TODO so we have a single point where it can be checked ?
  public userHasPowerLevelFor(
    room: IRoom,
    userId: string,
    eventType: StateEventName | RoomEventName
  ): boolean {
    const isState = eventTypeHelper.isState(eventType);

    const powerLevelsEvent = room.roomEventsByName(
      StateEventName.M_ROOM_POWER_LEVELS_EVENT
    )[0]?.content as any; // cast to any to keep original matrix bot sdk code
    if (!powerLevelsEvent) {
      // This is technically supposed to be non-fatal, but it's pretty unreasonable for a room to be missing
      // power levels.
      return false;
    }

    let requiredPower = isState ? 50 : 0;
    if (isState && Number.isFinite(powerLevelsEvent['state_default']))
      requiredPower = powerLevelsEvent['state_default'];
    if (!isState && Number.isFinite(powerLevelsEvent['events_default']))
      requiredPower = powerLevelsEvent['events_default'];
    if (Number.isFinite(powerLevelsEvent['events']?.[eventType]))
      requiredPower = powerLevelsEvent['events'][eventType];
    // We also handle the action here although is now outsourced to userHasPowerLevelForAction
    if (Number.isFinite(powerLevelsEvent[eventType]))
      requiredPower = powerLevelsEvent[eventType];

    let userPower = 0;
    if (Number.isFinite(powerLevelsEvent['users_default']))
      userPower = powerLevelsEvent['users_default'];
    if (Number.isFinite(powerLevelsEvent['users']?.[userId]))
      userPower = powerLevelsEvent['users'][userId];

    return userPower >= requiredPower;
  }

  /**
   * Checks if a given user has a required power level to perform the given action
   * @param {IRoom} room room
   * @param {string} userId the user ID to check the power level of
   * @param {PowerLevelAction} action the action to check power level for
   * @returns {Promise<boolean>} resolves to true if the user has the required power level, resolves to false otherwise
   */

  public userHasPowerLevelForAction(
    room: IRoom,
    userId: string,
    action: PowerLevelAction
  ): boolean {
    const powerLevelsEvent = room.roomEventsByName(
      StateEventName.M_ROOM_POWER_LEVELS_EVENT
    )[0]?.content as any; // cast to any to keep original matrix bot sdk code
    if (!powerLevelsEvent) {
      // This is technically supposed to be non-fatal, but it's pretty unreasonable for a room to be missing
      // power levels.
      return false;
    }
    const defaultForActions: { [A in PowerLevelAction]: number } = {
      [PowerLevelAction.Ban]: 50,
      [PowerLevelAction.Invite]: 50,
      [PowerLevelAction.Kick]: 50,
      [PowerLevelAction.RedactEvents]: 50,
      [PowerLevelAction.NotifyRoom]: 50,
    };

    let requiredPower = defaultForActions[action];

    let investigate = powerLevelsEvent;
    action.split('.').forEach((k) => (investigate = investigate?.[k]));
    if (Number.isFinite(investigate)) requiredPower = investigate;

    let userPower = 0;
    if (Number.isFinite(powerLevelsEvent['users_default']))
      userPower = powerLevelsEvent['users_default'];
    if (Number.isFinite(powerLevelsEvent['users']?.[userId]))
      userPower = powerLevelsEvent['users'][userId];

    return userPower >= requiredPower;
  }

  public calculateUserPowerLevel(
    powerLevelStateEvent: PowerLevelsEventContent,
    userId?: string
  ): number {
    // See https://github.com/matrix-org/matrix-spec/blob/203b9756f52adfc2a3b63d664f18cdbf9f8bf126/data/event-schemas/schema/m.room.power_levels.yaml#L8-L12
    return (
      (userId ? powerLevelStateEvent.users?.[userId] : undefined) ??
      powerLevelStateEvent.users_default ??
      0
    );
  }
}

export const powerLevelHelper = new PowerLevelHelper();
