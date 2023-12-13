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

import { Inject, Injectable } from '@nestjs/common';
import {
  MatrixClient,
  MembershipEventContent,
  PowerLevelsEventContent,
} from 'matrix-bot-sdk';
import { AppRuntimeContext } from '../AppRuntimeContext';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { StateEventName } from '../model/StateEventName';

/**
 * Changes power level of the guest user to the guest default if he joins or leaves the room or is promoted.
 *
 * Change is active if the following is true:
 *  - guest user power level change is enabled
 *  - the default guest user power level is lower than the default user power level
 *  - bot is allowed to change power levels
 */
@Injectable()
export class GuestMemberService {
  constructor(
    private appRuntimeContext: AppRuntimeContext,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfiguration: IAppConfiguration,
    private matrixClient: MatrixClient,
  ) {}

  /**
   * Changes power level of the guest user who joins or leaves the room
   *
   * @param roomId room id
   * @param memberEvent member event
   */
  public async processMember(
    roomId: string,
    memberEvent: IStateEvent<MembershipEventContent>,
  ): Promise<void> {
    const {
      enable_guest_user_power_level_change,
      guest_user_prefix,
      guest_user_default_power_level,
      guest_user_delete_power_level_on_leave,
    } = this.appConfiguration;

    const membership = memberEvent.content.membership;

    const memberEventMatches =
      enable_guest_user_power_level_change &&
      memberEvent.state_key.startsWith(guest_user_prefix) &&
      (membership === 'join' || membership === 'leave');

    if (!memberEventMatches) {
      return;
    }

    let powerLevels: PowerLevelsEventContent | undefined;

    try {
      powerLevels = await this.matrixClient.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
      );
    } catch (err) {
      powerLevels = undefined;
    }

    if (!powerLevels || !this.shouldCheckGuestPowerLevel(powerLevels)) {
      return;
    }

    let newPowerLevels: PowerLevelsEventContent | undefined;

    if (
      membership === 'join' &&
      powerLevels.users?.[memberEvent.state_key] === undefined
    ) {
      newPowerLevels = {
        ...powerLevels,
        users: {
          ...(powerLevels.users ?? {}),
          [memberEvent.state_key]: guest_user_default_power_level,
        },
      };
    } else if (
      guest_user_delete_power_level_on_leave &&
      membership === 'leave' &&
      powerLevels.users?.[memberEvent.state_key] !== undefined
    ) {
      newPowerLevels = { ...powerLevels };
      delete newPowerLevels.users![memberEvent.state_key];
    }

    if (newPowerLevels) {
      await this.matrixClient.sendStateEvent(
        roomId,
        StateEventName.M_ROOM_POWER_LEVELS_EVENT,
        '',
        newPowerLevels,
      );
    }
  }

  /**
   * Changes power level of the guest user to default if guest is promoted by another user
   *
   * @param roomId room id
   * @param powerLevelEvent power level event
   */
  public async processPowerLevels(
    roomId: string,
    powerLevelEvent: IStateEvent<PowerLevelsEventContent>,
  ): Promise<void> {
    const {
      enable_guest_user_power_level_change,
      guest_user_prefix,
      guest_user_default_power_level,
    } = this.appConfiguration;

    const powerLevels = powerLevelEvent.content;

    if (
      !enable_guest_user_power_level_change ||
      !this.shouldCheckGuestPowerLevel(powerLevels)
    ) {
      return;
    }

    const users = powerLevels.users ?? {};

    const hasGuestPowerModified = Object.entries(users).some(
      ([userId, userPower]) =>
        userId.startsWith(guest_user_prefix) &&
        userPower !== guest_user_default_power_level,
    );

    if (!hasGuestPowerModified) {
      return;
    }

    const newUsers = Object.fromEntries(
      Object.entries(users).map(([userId, userPower]) => {
        const changePower =
          userId.startsWith(guest_user_prefix) &&
          userPower !== guest_user_default_power_level;

        return [
          userId,
          changePower ? guest_user_default_power_level : userPower,
        ];
      }),
    );

    const newPowerLevels: PowerLevelsEventContent = {
      ...powerLevels,
      users: newUsers,
    };

    await this.matrixClient.sendStateEvent(
      roomId,
      StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      '',
      newPowerLevels,
    );
  }

  /**
   * Checks power levels event if bot should apply guest power level changes
   * @param powerLevels power levels event
   */
  private shouldCheckGuestPowerLevel(
    powerLevels: PowerLevelsEventContent,
  ): boolean {
    const { botUserId } = this.appRuntimeContext;

    const { guest_user_default_power_level } = this.appConfiguration;

    const usersDefaultPower = powerLevels.users_default ?? 0;
    const botPower = powerLevels.users?.[botUserId] ?? usersDefaultPower;

    const powerLevelsPower =
      powerLevels.events?.['m.room.power_levels'] ??
      powerLevels.state_default ??
      50;

    return (
      usersDefaultPower > guest_user_default_power_level &&
      botPower >= powerLevelsPower
    );
  }
}
