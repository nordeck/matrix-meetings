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

import { Inject, Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import { MatrixClient, MembershipEventContent } from 'matrix-bot-sdk';
import path from 'path';
import { AppRuntimeContext } from '../AppRuntimeContext';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { MeetingClient } from '../client/MeetingClient';
import { WidgetClient } from '../client/WidgetClient';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { IControlRoomMigrationEventContent } from '../model/IControlRoomMigrationEventContent';
import { IRoom } from '../model/IRoom';
import { IWidgetContent } from '../model/IWidgetContent';
import { StateEventName } from '../model/StateEventName';
import {
  WidgetLayoutConfigItem,
  WidgetLayoutStateEventContent,
} from '../model/WidgetLayoutTypes';

@Injectable()
export class ControlRoomMigrationService {
  private readonly botId: string;
  private logger = new Logger(ControlRoomMigrationService.name);
  private roomAvatarUrl: string | undefined = undefined;
  private readonly meetingsWidgetHostname: string;

  constructor(
    public readonly client: MatrixClient,
    public readonly meetingClient: MeetingClient,
    private readonly widgetClient: WidgetClient,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private readonly appConfig: IAppConfiguration,
    appRuntimeContext: AppRuntimeContext
  ) {
    this.botId = appRuntimeContext.botUserId;
    this.meetingsWidgetHostname = new URL(
      this.appConfig.meetingwidget_url
    ).hostname;
  }

  public async migrateControlBotRooms() {
    if (!this.appConfig.enable_control_room_migration) return;

    this.logger.log(
      `Starting migration of control rooms for the given Bot  ${this.botId}`
    );
    const allRooms: IRoom[] = await this.meetingClient.loadRooms(false);
    this.logger.log(
      `Loading rooms for the bot ${this.botId}.  Room Count == ${allRooms.length}`
    );
    for (const room of allRooms) {
      try {
        const directRoomWith2Persons = this.isADirectRoomWithTwoPersons(room);
        const roomMeetingWidgetStateKey =
          this.getStateKeyOfConfiguredMeetingsWidget(room);

        if (directRoomWith2Persons && roomMeetingWidgetStateKey) {
          this.logger.log(
            `yes try migrate room id : ${room.id} directRoomWith2Persons:  ${directRoomWith2Persons} roomMeetingWidgetStateKey:  ${roomMeetingWidgetStateKey}`
          );
          await this.migrateSingleRoom(room, 1, roomMeetingWidgetStateKey);
        } else {
          this.logger.log(
            `not to migrate room id : ${room.id} directRoomWith2Persons:  ${directRoomWith2Persons}  roomMeetingWidgetStateKey:  ${roomMeetingWidgetStateKey}`
          );
        }
      } catch (err) {
        this.logger.error(
          err,
          `Failure on room-migration. room.id : ${room.id}`
        );
      }
    }
  }

  private async getRoomAvatarUrl(): Promise<string | undefined> {
    if (!this.roomAvatarUrl) {
      try {
        this.roomAvatarUrl = await this.client.uploadContent(
          fs.readFileSync(
            path.join(__dirname, '../static/images/calendar_avatar.png')
          ),
          'image/png'
        );
      } catch (err) {
        this.logger.error(err, 'Unable to set bot-help-room avatar image.');
      }
    }
    return this.roomAvatarUrl;
  }

  public async migrateSingleRoom(
    room: IRoom,
    version: number | undefined,
    meetingsWidgetStateKey: string | undefined
  ) {
    if (version && this.isAlreadyMigrated(room, version)) {
      this.logger.log(
        `migrateSingleRoom room id : ${room.id} .... skip - already migrated`
      );
      return;
    }

    // Change the avatar of the room :
    const avatarUrl = {
      url: await this.getRoomAvatarUrl(),
    };

    await this.client.sendStateEvent(
      room.id,
      StateEventName.M_ROOM_AVATAR,
      '',
      avatarUrl
    );

    // Change the name of the room. bevor there was non of dataport site
    const nameContent = {
      name: this.appConfig.calendar_room_name,
    };
    await this.client.sendStateEvent(
      room.id,
      StateEventName.M_ROOM_NAME_EVENT,
      '',
      nameContent
    );

    // change the meeting-widget
    const content = await this.widgetClient.getMeetingWidgetEventContentAsync(
      meetingsWidgetStateKey
    );
    await this.client.sendStateEvent(
      room.id,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      content.id,
      content
    );

    const widgetLayoutConfigItem: WidgetLayoutConfigItem = {
      container: 'center',
    };
    const widgetLayoutContent: WidgetLayoutStateEventContent = {
      widgets: {
        [content.id]: widgetLayoutConfigItem,
      },
    };

    await this.client.sendStateEvent(
      room.id,
      StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
      '',
      widgetLayoutContent
    );

    // set the version of migration
    if (version) {
      const migrationContent: IControlRoomMigrationEventContent = {
        room_version: version,
      };
      await this.client.sendStateEvent(
        room.id,
        StateEventName.NIC_CONTROLROOM_MIGRATION_VERSION,
        '',
        migrationContent
      );
    }
  }

  // Would be better to check the m.direct of the room-account-data. But always fails
  // On dataport-site the is_direct is located in the member-event of the bot
  // on our site it's located inside in invited user
  // check all and if there is a flag, use it
  /**
   * Checks for 2 persons are member of the room and if one of them is the bot and if there is a flag of direct where ever can be found,
   * @param room: the room, that has to be checked.
   * @private
   */
  private isADirectRoomWithTwoPersons(room: IRoom) {
    const memberEvent = room.roomEventsByName(
      StateEventName.M_ROOM_MEMBER_EVENT
    ) as IStateEvent<MembershipEventContent>[];

    if (!(memberEvent && memberEvent.length === 2)) {
      return false;
    }
    const bot_member_event = memberEvent.find(
      (se) => se.state_key === this.botId
    );
    if (!bot_member_event) {
      return false;
    }
    for (const event of memberEvent) {
      if (event?.unsigned?.prev_content?.is_direct) return true;
      if (event?.content?.is_direct) return true;
    }
    return false;
  }

  private isAlreadyMigrated(room: IRoom, version: number): boolean {
    const migration = room.roomEventsByName(
      StateEventName.NIC_CONTROLROOM_MIGRATION_VERSION
    ) as IStateEvent<IControlRoomMigrationEventContent>[];
    if (migration && migration.length === 1) {
      return migration[0].content?.room_version >= version;
    }
    return false;
  }
  /**
   * get the statekey of the meeting-widget, if there is any. a controllbot-room has only the one meetings-widget
   * @param room: the room, that has to be checked.
   * @private
   */
  private getStateKeyOfConfiguredMeetingsWidget(room: IRoom) {
    const widgetEvents: IStateEvent<IWidgetContent>[] = room.widgetEvents(true);
    if (!widgetEvents) return undefined;
    if (widgetEvents.length !== 1) return undefined;
    const widget: IStateEvent<IWidgetContent> = widgetEvents[0];
    const url = widget.content?.url;

    if (url.indexOf(this.meetingsWidgetHostname) >= 0) {
      return widget.state_key;
    }
    return undefined;
  }
}
