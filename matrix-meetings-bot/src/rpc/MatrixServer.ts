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

import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import {
  CustomTransportStrategy,
  MessageHandler,
  MsPattern,
  Server,
} from '@nestjs/microservices';
import {
  MatrixClient,
  MatrixProfileInfo,
  MembershipEvent,
} from 'matrix-bot-sdk';
import { PinoLogger } from 'nestjs-pino';
import { storage, Store } from 'nestjs-pino/storage';
import * as pino from 'pino';
import { lastValueFrom, Observable } from 'rxjs';
import { AppRuntimeContext } from '../AppRuntimeContext';
import { ReactionClient } from '../client/ReactionClient';
import { IAppConfiguration } from '../IAppConfiguration';
import { BotEventType } from '../matrix/BotEventType';
import { IBotEventContent } from '../matrix/event/IBotEventContent';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { IUserContext } from '../model/IUserContext';
import { RoomEventName } from '../model/RoomEventName';
import { StateEventName } from '../model/StateEventName';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { IContext } from './IContext';
import { IMatrixPattern } from './IMatrixPattern';
import { ControlRoomMigrationService } from '../service/ControlRoomMigrationService';
import { RoomMessageService } from '../service/RoomMessageService';

export const NET_NORDECK_MEETINGS = 'net.nordeck.meetings';

type Dto = unknown;
type HandlerData = IRoomEvent<Dto> | Dto;

export interface IHandlerArguments {
  data: HandlerData;
  context: IContext;
}

interface ISubscriber {
  botEventType: BotEventType;
  listener: (...args: any[]) => void;
}

const USER_LOCALE_DEFAULT = 'en';
const USER_TIMEZONE_DEFAULT = 'UTC';

/**
 * Provides access to the bot API via Matrix
 */
@Injectable()
export class MatrixServer
  extends Server
  implements CustomTransportStrategy, OnModuleInit, OnApplicationShutdown
{
  protected logger = new Logger(MatrixServer.name);

  private pinoLoggerRoot: pino.Logger = undefined as unknown as pino.Logger;

  private readonly botEventTypes = Object.values(BotEventType);

  private subscribers: ISubscriber[] = [];

  /**
   * Mapping of room id to Promise with Bot room invite/join origin_server_ts.
   * @private
   */
  private roomIdToBotMemberTimestampMap = new Map<
    string,
    Promise<number | undefined>
  >();

  constructor(
    private appRuntimeContext: AppRuntimeContext,
    private matrixClient: MatrixClient,
    private reactionClient: ReactionClient,
    private roomMessageService: RoomMessageService,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
    private controlRoomMigrationService?: ControlRoomMigrationService
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('module init');

    if (!PinoLogger.root) {
      throw new Error(
        'pino logger root is undefined, make sure nestjs-pino LoggerModule is configured'
      );
    }
    this.pinoLoggerRoot = PinoLogger.root;

    const _filter = {
      event_fields: [],
      account_data: {
        types: [],
      },
      presence: {
        types: [],
      },
      room: {
        // rooms,
        account_data: {
          types: [],
        },
        ephemeral: {
          types: [],
        },
        state: {
          types: [],
          lazy_load_members: false,
        },
        timeline: {
          types: [
            StateEventName.M_ROOM_MEMBER_EVENT,
            StateEventName.M_ROOM_POWER_LEVELS_EVENT,
            RoomEventName.M_ROOM_MESSAGE,
            RoomEventName.NIC_MEETINGS_MEETING_CREATE,
            RoomEventName.NIC_MEETINGS_BREAKOUTSESSIONS_CREATE,
            RoomEventName.NIC_MEETINGS_MEETING_UPDATE_DETAILS,
            RoomEventName.NIC_MEETING_MEETING_CHANGE_MESSAGING_PERMISSIONS,
            RoomEventName.NIC_MEETINGS_MEETING_CLOSE,
            RoomEventName.NIC_MEETINGS_SUB_MEETINGS_SEND_MESSAGE,
            RoomEventName.NIC_MEETINGS_MEETING_PARTICIPANTS_HANDLE,
            RoomEventName.NIC_MEETINGS_MEETING_WIDGETS_HANDLE,
          ],
          limit: this.appConfig.matrix_filter_timeline_limit,
        },
      },
    };

    const filter = this.appConfig.matrix_filter_apply ? _filter : null;
    this.logger.log(`matrix client filter: ${JSON.stringify(filter)}`);
    await this.matrixClient.start(filter);

    this.logger.log(
      'Bot is running as %s %s %s ',
      this.appRuntimeContext.botUserId,
      this.appRuntimeContext.displayName,
      this.appRuntimeContext.localpart
    );

    if (
      this.controlRoomMigrationService &&
      this.appConfig.enable_control_room_migration
    ) {
      try {
        this.logger.log('Starting Migration');
        await this.controlRoomMigrationService.migrateControlBotRooms();
        this.logger.log('End Migration');
      } catch (err) {
        this.logger.error(err, 'Failure while migration');
      }
    }

    // initialization needs to happen after migration script to avoid member event modification and loosing is_direct flag
    await this.botInitialize();
  }

  async botInitialize() {
    try {
      const botUserProfile = (await this.matrixClient.getUserProfile(
        this.appRuntimeContext.botUserId
      )) as MatrixProfileInfo;

      const envBotDisplayName = this.appConfig.bot_displayname;
      if (
        envBotDisplayName &&
        envBotDisplayName !== botUserProfile.displayname
      ) {
        await this.matrixClient.setDisplayName(envBotDisplayName);
      }

      // TODO: uncomment when bot icon is ready
      // if(!botUserProfile?.avatar_url) {
      //   const avatar_url = await this.matrixClient.uploadContent(fs.readFileSync(path.join(__dirname, '../static/images/bot.jpg')), 'image/jpg');
      //   await this.matrixClient.setAvatarUrl(avatar_url);
      // }
    } catch (err) {
      this.logger.error(err, 'Unable to initialize bot-user.');
    }
  }

  onApplicationShutdown(_signal?: string): any {
    this.logger.log('application shutdown');
    this.matrixClient.stop();
  }

  close(): any {
    for (const subscriber of this.subscribers) {
      this.matrixClient.off(subscriber.botEventType, subscriber.listener);
    }
  }

  getHandlerByPattern(
    pattern: string
  ): MessageHandler<HandlerData, IContext, void> | null {
    return super.getHandlerByPattern(pattern);
  }

  normalizePattern(pattern: MsPattern): string {
    return super.normalizePattern(pattern);
  }

  listen(callback: (...optionalParams: unknown[]) => any): any {
    for (const botEventType of this.botEventTypes) {
      const listener = async (roomId: string, event: IRoomEvent<unknown>) => {
        try {
          await this.processEvent(botEventType, roomId, event);
        } catch (err) {
          // catches any error, otherwise node terminates
          this.logger.error(err);
        }
      };

      this.matrixClient.on(botEventType, listener);

      const subscriber: ISubscriber = {
        botEventType,
        listener,
      };
      this.subscribers.push(subscriber);
    }

    callback();
    this.logger.log('Matrix Server is started');
  }

  async processEvent(
    botEventType: BotEventType,
    roomId: string,
    event: IRoomEvent<unknown>
  ): Promise<void> {
    if (!event || !event.content || !event.type) return;

    const eventAgeMinutes = (Date.now() - event.origin_server_ts) / 60000;

    if (botEventType === BotEventType.ROOM_INVITE) {
      /**
       * bot 'room.invite' is sent first when bot is invited to the room
       * matrix event passed is of type 'm.room.member' with bot membership set to 'invite'
       * origin_server_ts is used as filter for all upcoming matrix events
       * origin_server_ts considered equal to bot join 'origin_server_ts' because of bot auto join
       */
      this.roomIdToBotMemberTimestampMap.set(
        roomId,
        Promise.resolve(event.origin_server_ts)
      );
    } else if (botEventType === BotEventType.ROOM_LEAVE) {
      // delete the entry to fetch origin_server_ts later when events will come again from this room
      this.roomIdToBotMemberTimestampMap.delete(roomId);
    }

    // apply timestamp check to NIC room events that are handled by Bot
    const applyFilterByOriginServer: boolean = this.eventIsRegisteredByBot(
      botEventType,
      event
    );

    let botMemberTs: number | undefined;

    if (applyFilterByOriginServer) {
      let botMemberTsPromise: Promise<number | undefined>;

      const memberTsPromiseFromMap =
        this.roomIdToBotMemberTimestampMap.get(roomId);
      if (memberTsPromiseFromMap) {
        botMemberTsPromise = memberTsPromiseFromMap;
      } else {
        botMemberTsPromise = this.matrixClient
          .getRoomMembers(roomId)
          .then((membershipEvents: MembershipEvent[]) => {
            const botFetchedMemberTs: number | undefined =
              membershipEvents.find((e) => {
                return (
                  e.stateKey === this.appRuntimeContext.botUserId &&
                  e.membership === 'join'
                );
              })?.timestamp;

            if (botFetchedMemberTs) {
              return botFetchedMemberTs;
            } else {
              this.logger.error(
                `failed to load origin_server_ts for the room: ${roomId} triggered by event: ${event.event_id}, bot will not process events of this room!`
              );
              return undefined; // should not happen
            }
          });

        this.roomIdToBotMemberTimestampMap.set(roomId, botMemberTsPromise);
      }

      // waiting for bot member invite origin_server_ts to resolve
      botMemberTs = await botMemberTsPromise;
    }

    if (eventAgeMinutes > this.appConfig.matrix_server_event_max_age_minutes) {
      this.logger.verbose(
        `old event is ignored: ${event.event_id} from room: ${roomId}`
      );
      return;
    } else if (applyFilterByOriginServer) {
      if (!botMemberTs) {
        this.logger.verbose(
          `bot's member invite event not loaded, event is ignored: ${event.event_id} from room: ${roomId}`
        );
        return;
      } else if (event.origin_server_ts < botMemberTs) {
        this.logger.verbose(
          `event before bot membership is ignored: ${event.event_id} from room: ${roomId}`
        );
        return;
      }
    }

    const matrixEventType = event.type as RoomEventName | StateEventName;

    const botPattern: IMatrixPattern = {
      botEventType,
      matrixEventType,
    };
    const pattern = this.normalizePattern(botPattern);
    const handler = this.getHandlerByPattern(pattern);

    const childLogger = this.pinoLoggerRoot.child({ matrix_event: event });

    if (!handler) {
      this.logger.verbose(`handler not found for ${pattern}`);
    } else {
      const args = this.extractHandlerArguments(botEventType, roomId, event);
      const result: Observable<any> = this.transformToObservable(
        // execute handler, exceptions are handled by nest exception filter
        await storage.run(new Store(childLogger), () =>
          handler(args.data, args.context)
        )
      );
      await lastValueFrom(result);
      if (this.eventIsRegisteredByBot(botEventType, event)) {
        try {
          await this.reactionClient.sendSuccess(roomId, event.event_id);
        } catch (e) {
          this.logger.warn(
            `Could not send success to user ${args.context?.userContext?.userId} and room : ${roomId}`
          );
        }
      }
    }
  }

  public eventIsRegisteredByBot(
    botEventType: BotEventType,
    event: IRoomEvent<unknown>
  ) {
    return (
      botEventType === BotEventType.ROOM_EVENT &&
      event.type.startsWith(NET_NORDECK_MEETINGS) && // is NIC event
      !(event as IStateEvent<unknown>).state_key && // is matrix room event
      Object.values(RoomEventName)
        .map((v) => v as string)
        .includes(event.type)
    ); // is known Bot event
  }

  extractHandlerArguments(
    botEventType: BotEventType,
    roomId: string,
    event: IRoomEvent<unknown>
  ): IHandlerArguments {
    if (this.eventIsRegisteredByBot(botEventType, event)) {
      // content of nordeck room events contain wrapped Dto
      const content = event.content as IBotEventContent<Dto>;

      const eventUserContext = content.context;

      // override user context passed
      const customUserContext: IUserContext = {
        locale: eventUserContext?.locale ?? USER_LOCALE_DEFAULT,
        timezone: eventUserContext?.timezone ?? USER_TIMEZONE_DEFAULT,
        userId: event.sender,
        requestId: event.event_id,
      };

      return {
        data: content.data,
        context: {
          roomId,
          event,
          userContext: customUserContext,
        },
      };
    } else {
      // create user context from default values
      const userContext: IUserContext = {
        locale: USER_LOCALE_DEFAULT,
        timezone: USER_TIMEZONE_DEFAULT,
        userId: event.sender,
        requestId: event.event_id,
      };
      return {
        data: event,
        context: {
          roomId,
          event,
          userContext,
        },
      };
    }
  }

  subscribersLength(): number {
    return this.subscribers.length;
  }
}
