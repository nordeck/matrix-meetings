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
import i18next, { TOptions } from 'i18next';
import {
  MatrixClient,
  MembershipEventContent,
  PowerLevelsEventContent,
  RoomCreateOptions,
} from 'matrix-bot-sdk';
import { AppRuntimeContext } from '../AppRuntimeContext';
import { IAppConfiguration } from '../IAppConfiguration';
import { ModuleProviderToken } from '../ModuleProviderToken';
import { MeetingClient } from '../client/MeetingClient';
import { WidgetClient } from '../client/WidgetClient';
import { TranslatableError } from '../error/TranslatableError';
import { IStateEvent, iStateEventHelper } from '../matrix/event/IStateEvent';
import { IRoom } from '../model/IRoom';
import { powerLevelHelper } from '../model/PowerLevelHelper';
import { StateEventName } from '../model/StateEventName';
import { WidgetType } from '../model/WidgetType';
import { ControlRoomMigrationService } from './ControlRoomMigrationService';
import { RoomMessageService } from './RoomMessageService';

// info that can be retrieved from NIC_MEETINGS_WELCOME_ROOM state event
interface IPrivateRoomContext {
  roomId: string;
  originalRoomName: string;
  originalRoomId: string;
  locale: string;
  userId: string;
  userDisplayName: string;
}

// variables for i18n
interface TranslationContext extends TOptions {
  locale?: string; // locale of the message ('en', 'de')
  roomName?: string; // name of the room that will display the message
  roomId?: string; // roomId of the room that will display the message
  originalRoomLink?: string; // URL for the original room that is linked to the private chat room
  originalRoomId?: string; // roomId for the original room
  originalRoomName?: string; // name for the original room
  userId?: string; // userId of the intended receiver of the message
  userDisplayName?: string; // 'displayname' of the intended receiver of the message
  widgetURL?: string; // the URL for the meeting-widget
}

interface TranslationOptions extends TranslationContext {
  lng?: string;
  joinArrays?: string;
}

enum RoomType {
  HELP_ROOM,
  CALENDAR_ROOM,
}

@Injectable()
export class WelcomeWorkflowService {
  private logger = new Logger(WelcomeWorkflowService.name);

  private readonly botId: string;
  private readonly supportedLanguages: string[];
  private welcomeRoomAvatar: string | undefined = undefined;

  constructor(
    public readonly client: MatrixClient,
    public readonly meetingClient: MeetingClient,
    private readonly widgetClient: WidgetClient,
    private readonly controlRoomMigrationService: ControlRoomMigrationService,
    private readonly roomMessageService: RoomMessageService,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private readonly appConfig: IAppConfiguration,
    appRuntimeContext: AppRuntimeContext,
  ) {
    this.botId = appRuntimeContext.botUserId;
    this.supportedLanguages = appRuntimeContext.supportedLngs;
  }

  /**
   * on room invite creates the private help room or migrates 1-to-1 chat to calendar room depending on:
   * bot was invited to the existing room or user started a 1-to-1 chat with the bot.
   * @param roomId
   * @param event
   */
  public async processRoomInvite(
    roomId: string,
    event: IStateEvent<MembershipEventContent>,
  ): Promise<void> {
    if (!this.appConfig.enable_welcome_workflow) return;

    const { sender } = event;

    // Autojoin the original room first so that we can insert it's name into the private room invitation.
    // Without joining the room we can't get the name.
    await this.client.joinRoom(roomId);

    // get info on the original room
    const locale = this.appConfig.welcome_workflow_default_locale;

    const room: IRoom = await this.meetingClient.fetchRoomAsync(roomId);
    const roomMemberEvents = room.roomEventsByName(
      StateEventName.M_ROOM_MEMBER_EVENT,
    ) as IStateEvent<MembershipEventContent>[];
    const botIsDirect = !!roomMemberEvents.find(
      (e) => e.state_key === this.botId && e.unsigned?.prev_content?.is_direct,
    );

    const roomType: RoomType = botIsDirect
      ? RoomType.CALENDAR_ROOM
      : RoomType.HELP_ROOM;

    let originalRoomName: string | undefined;
    try {
      originalRoomName = await this.getRoomName(roomId);
    } catch (err) {
      // keep original room name undefined
    }
    const { displayname } = await this.client.getUserProfile(sender);

    // available translation variables are limited because we are not in a private room
    const translationContext: TranslationContext = {
      locale,
      originalRoomName,
      originalRoomId: roomId,
      userId: sender,
      userDisplayName: displayname,
      roomId: '',
      roomName: '',
      originalRoomLink: '',
      widgetURL: this.appConfig.meetingwidget_url,
    };

    if (roomType === RoomType.HELP_ROOM) {
      const privateRoomName = i18next.t(
        'welcome.privateRoom.name',
        'Help for {{originalRoomName}}',
        this.i18nOptions(translationContext),
      );
      const topic = i18next.t(
        'welcome.privateRoom.topic',
        'How to use this bot to setup the widget bot in the room {{originalRoomName}}.',
        this.i18nOptions(translationContext),
      );

      const directMessageRooms =
        await this.roomMessageService.findDirectMessageRoomsForUser(
          sender,
          StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        );
      for (const room of directMessageRooms) {
        if (room.content.originalRoomId === roomId) {
          // don't continue with the new private chat and introductions
          this.logger.debug(
            `processRoomInvite: welcome room already exists: ${directMessageRooms[0].roomId}`,
          );
          return;
        }
      }

      // create the private chat
      const privateRoomId = await this.createPrivateRoom(
        roomType,
        sender,
        roomId,
        privateRoomName,
        topic,
      );

      // invite the user and provide a reason
      await this.inviteUser(privateRoomId, roomType, sender, roomId);

      this.logger.debug(
        `invite to private room originalroom: ${roomId}, sender: ${sender}, privateRoomId:${privateRoomId}`,
      );
    } else if (roomType === RoomType.CALENDAR_ROOM) {
      await this.controlRoomMigrationService.migrateSingleRoom(
        room,
        1,
        undefined,
      );
    } else {
      throw new Error(`roomType not supported: ${roomType}`);
    }
  }

  // person joined the bot's private room for the first time directly after an invite
  public async processUserJoinedPrivateRoom(
    roomId: string,
    event: IStateEvent<MembershipEventContent>,
  ): Promise<void> {
    if (!this.appConfig.enable_welcome_workflow) return;

    const { type, sender } = event;
    const membership = event?.content?.membership;
    const previousMembership = event?.unsigned?.prev_content?.membership;

    const allow =
      membership === 'join' &&
      type === StateEventName.M_ROOM_MEMBER_EVENT &&
      sender !== this.botId &&
      previousMembership === 'invite';

    if (!allow) return;

    const privateRoom: boolean = await this.isKnownPrivateRoom(roomId);
    if (!privateRoom) return;

    this.logger.debug(`show first welcome: room: ${roomId}, sender: ${sender}`);

    const context: TranslationContext =
      await this.getTranslationContext(roomId);
    await this.updateTopic(roomId, context);
    await this.sendIntroductionMessage(roomId, true, context);
  }

  // check the powerlevel change in case we got administrator rights
  public async processPowerlevelChange(
    roomId: string,
    event: IStateEvent<PowerLevelsEventContent>,
  ): Promise<void> {
    if (!this.appConfig.enable_welcome_workflow) return;

    if (event.type !== StateEventName.M_ROOM_POWER_LEVELS_EVENT) return;

    // ignore powerlevel events that don't have prev_content
    // we need to catch the actual change in bot's powerlevels
    if (!event?.unsigned?.prev_content) return;

    const botPower: number = event?.content?.users?.[this.botId] || 0;
    const previousBotPower: number =
      event?.unsigned?.prev_content?.users?.[this.botId] || 0;

    if (botPower > previousBotPower) {
      const isPrivate: boolean = await this.isKnownPrivateRoom(roomId);
      if (isPrivate) return;

      const widgetAdmin = await this.canManipulateWidgets(roomId);
      if (!widgetAdmin) return;

      this.logger.debug(`detected widget editor rights in room ${roomId}`);

      // just add the widget to this public room automatically
      const exists: boolean = await this.checkMeetingWidgetExists(roomId);
      if (!exists) {
        await this.addWidgetToRoom(roomId);
      }
    }
  }

  private async canManipulateWidgets(roomId: string): Promise<boolean> {
    const room = await this.meetingClient.fetchRoomAsync(roomId);
    return powerLevelHelper.userHasPowerLevelFor(
      room,
      this.botId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
    );
  }

  // bot will leave the private room if the person leaves
  public async processUserLeavePrivateRoom(
    roomId: string,
    event: IStateEvent<MembershipEventContent>,
  ): Promise<void> {
    if (!this.appConfig.enable_welcome_workflow) return;

    const { type, sender, event_id } = event;
    const membership = event?.content?.membership;

    if (!membership) {
      this.logger.warn(`membership is undefined for ${type} event ${event_id}`);
      return;
    }

    const allow =
      membership === 'leave' &&
      type === StateEventName.M_ROOM_MEMBER_EVENT &&
      sender !== this.botId;

    if (!allow) return;

    const privateRoom: boolean = await this.isKnownPrivateRoom(roomId);
    if (!privateRoom) return;

    await this.client.leaveRoom(roomId);
    this.logger.debug(`leave private room: room: ${roomId}`);
  }

  private async updateRoomName(roomId: string, _context?: TranslationContext) {
    const context: TranslationContext =
      _context ?? (await this.getTranslationContext(roomId));
    const name = i18next.t(
      'welcome.privateRoom.name',
      this.i18nOptions(context),
    );
    await this.client.sendStateEvent(
      roomId,
      StateEventName.M_ROOM_NAME_EVENT,
      '',
      { name },
    );
  }

  private async updateTopic(roomId: string, _context?: TranslationContext) {
    const context: TranslationContext =
      _context ?? (await this.getTranslationContext(roomId));
    const topic = i18next.t(
      'welcome.privateRoom.topic',
      this.i18nOptions(context),
    );
    await this.client.sendStateEvent(
      roomId,
      StateEventName.M_ROOM_TOPIC_EVENT,
      '',
      { topic },
    );
  }

  public async handleStatusCommand(roomId: string) {
    const isPrivate = await this.isKnownPrivateRoom(roomId);
    if (!isPrivate) return;

    const context = await this.getTranslationContext(roomId);
    await this.sendPowerlevelStatusMessage(roomId, context);
  }

  public async handleAddWidgetCommand(roomId: string) {
    const isPrivate = await this.isKnownPrivateRoom(roomId);
    if (!isPrivate) return;

    this.logger.debug(`add widget command in room ${roomId}`);

    // context is never null because we already know that this is a known private room
    const context: IPrivateRoomContext = (await this.getPrivateRoomContext(
      roomId,
    )) as IPrivateRoomContext;
    const translationContext: TranslationContext =
      await this.getTranslationContext(roomId);

    // check that bot is admin in the room
    const widgetAdmin = await this.canManipulateWidgets(context.originalRoomId);
    if (!widgetAdmin) {
      const html = i18next.t(
        'welcome.errors.notEnoughPermissions',
        "Unfortunately, I cannot add the calendar function. I don't have the right authorisation. Please give me moderator rights in your room <a href='{{originalRoomLink}}'>{{originalRoomName}}</a>.",
        this.i18nOptions(translationContext),
      );
      await this.client.sendHtmlText(roomId, html);
      this.logger.warn(
        `Can't add NeoDateFix widget to room, welcome.errors.notEnoughPermissions ${context.originalRoomId}`,
      );
      return;
    }

    // prevent adding several meeting widgets
    const exists: boolean = await this.checkMeetingWidgetExists(
      context.originalRoomId,
    );
    if (exists) {
      const html = i18next.t(
        'welcome.errors.meetingWidgetExists',
        "Can't add a new widget because it already exists.",
        this.i18nOptions(translationContext),
      );
      await this.client.sendHtmlText(roomId, html);
      this.logger.warn(
        `Can't add NeoDateFix widget to room, welcome.errors.meetingWidgetExists ${context.originalRoomId}`,
      );
      return;
    }

    await this.addWidgetToRoom(context.originalRoomId);

    const html = i18next.t(
      'welcome.meetingWidgetAdded',
      '<p>My job is done.</p><p>The calendar is already successfully installed into your room. You can leave this private chat-room.</p>',
      this.i18nOptions(translationContext),
    );
    await this.client.sendHtmlText(roomId, html);
  }

  private async sendPowerlevelStatusMessage(
    roomId: string,
    context: TranslationContext,
  ) {
    if (!context.originalRoomId) return;
    const isWidgetAdmin = await this.canManipulateWidgets(
      context.originalRoomId,
    );
    const htmls: string[] = [];

    const meetingWidgetExists: boolean = await this.checkMeetingWidgetExists(
      context.originalRoomId,
    );
    if (meetingWidgetExists) {
      htmls.push(
        i18next.t('welcome.meetingWidgetAdded', this.i18nOptions(context)),
      );
    } else {
      // display different messages for admin and non-admin bots
      if (isWidgetAdmin) {
        htmls.push(
          i18next.t(
            'welcome.botIsAdmin',
            "The bot is a moderator in the room <a href='{{originalRoomLink}}'>{{originalRoomName}}</a>. If you enter the command <code>!meeting setup</code> NeoDateFix widget will be added to that room.",
            this.i18nOptions(context),
          ),
        );
      } else {
        htmls.push(
          i18next.t(
            'welcome.botNotAdmin',
            "The bot is not a moderator in the room <a href='{{originalRoomLink}}'>{{originalRoomName}}</a>.",
            this.i18nOptions(context),
          ),
        );
      }

      if (!isWidgetAdmin) {
        // add an extra helpful message
        htmls.push(
          i18next.t(
            'welcome.helpWhenNotAdmin',
            "Unfortunately, I cannot add the calendar function. I don't have the right authorisation. Please give me moderator rights in your room <a href='{{originalRoomLink}}'>{{originalRoomName}}</a>.",
            this.i18nOptions(context),
          ),
        );
      }
    }

    await this.client.sendHtmlText(
      roomId,
      htmls.map((txt) => `<p>${txt}</p>`).join(''),
    );
  }

  public async handleLanguageChange(
    roomId: string,
    event: any,
    args: string[],
  ) {
    const locale: string = args[0];

    if (!locale) {
      const availableLanguageCodes = `${this.supportedLanguages.join(', ')}`;
      throw new TranslatableError('commandErrors.noLanguageCode', {
        availableLanguageCodes,
      });
    }

    if (!this.supportedLanguages.includes(locale)) {
      throw new TranslatableError('commandErrors.badLanguageCode');
    }

    // welcome commands only work in private rooms
    const isPrivate = await this.isKnownPrivateRoom(roomId);
    if (!isPrivate) return;

    this.logger.verbose(`change local to ${locale} `);

    // replace locale in the state
    const content = await this.fetchContextStateEvent(roomId);
    const newContent = {
      ...content,
      locale,
    };
    if (content.locale === newContent.locale) return;
    await this.client.sendStateEvent(
      roomId,
      StateEventName.NIC_MEETINGS_WELCOME_ROOM,
      this.botId,
      newContent,
    );

    const html = i18next.t(
      'welcome.languageWasChanged',
      'The language was changed to <b>{{locale}}</b>.',
      { lng: locale, locale },
    );
    await this.client.sendHtmlText(roomId, html);

    const context: TranslationContext =
      await this.getTranslationContext(roomId);
    await this.updateTopic(roomId, context);
    await this.updateRoomName(roomId, context);
    await this.sendIntroductionMessage(roomId, false, context);
  }

  private async sendIntroductionMessage(
    roomId: string,
    showLanguageIntro: boolean,
    _context?: TranslationContext,
  ): Promise<void> {
    const context: TranslationContext =
      _context ?? (await this.getTranslationContext(roomId));

    if (!context.originalRoomId) return;
    const meetingWidgetExists: boolean = await this.checkMeetingWidgetExists(
      context.originalRoomId,
    );

    const translated: string[] = [];
    if (showLanguageIntro)
      translated.push(
        i18next.t('welcome.introLanguage', this.i18nOptions(context)),
      );
    if (meetingWidgetExists) {
      translated.push(
        i18next.t('welcome.introDone', this.i18nOptions(context)),
      );
    } else {
      translated.push(i18next.t('welcome.intro', this.i18nOptions(context)));
    }

    if (context.roomId) {
      const html = translated.map((txt) => `<p>${txt}</p>`).join('');
      await this.client.sendHtmlText(context.roomId, html);
    }
  }

  private async addWidgetToRoom(roomId: string) {
    // don't add any widgets into the private room
    const privateRoom = await this.isKnownPrivateRoom(roomId);
    if (privateRoom) return;

    const state_key = `meetingwidget-${WidgetClient.createUUID()}`;
    const content =
      await this.widgetClient.getMeetingWidgetEventContentAsync(state_key);

    await this.client.sendStateEvent(
      roomId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      state_key,
      content,
    );

    const layout = {
      widgets: {
        [state_key]: {
          container: 'top',
          height: 100,
          index: 1,
          width: 100,
        },
      },
    };

    await this.client.sendStateEvent(
      roomId,
      StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
      '',
      layout,
    );

    this.logger.verbose(
      `added NeoDateFix widget to room ${roomId}, stateKey = ${state_key}`,
    );
  }

  public async fetchContextStateEvent(roomId: string): Promise<any> {
    try {
      return await this.client.getRoomStateEvent(
        roomId,
        StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        this.botId,
      );
    } catch (e) {
      return null;
    }
  }

  public async getPrivateRoomContext(
    roomId: string,
  ): Promise<IPrivateRoomContext | null> {
    const res = await this.fetchContextStateEvent(roomId);
    if (!res) return null;

    const { displayname } = await this.client.getUserProfile(res.userId);
    const originalRoomName = await this.getRoomName(res.originalRoomId);
    return {
      roomId,
      originalRoomName,
      originalRoomId: res.originalRoomId,
      locale: res.locale,
      userId: res.userId,
      userDisplayName: displayname,
    };
  }

  /**
   * Returns true if the room is private and created by the bot
   * TODO: optimize with caching
   * @param roomId
   */
  public async isKnownPrivateRoom(roomId: string): Promise<boolean> {
    return !!(await this.getPrivateRoomContext(roomId));
  }

  private async checkMeetingWidgetExists(roomId: string): Promise<boolean> {
    const room = await this.meetingClient.fetchRoomAsync(roomId);
    const events: any[] = room.roomEventsByName(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
    );
    const exists = events.find((e) => e?.content?.type === WidgetType.MEETINGS);
    return !!exists;
  }

  private async getRoomName(roomId: string): Promise<string> {
    const { name } =
      (await this.client.getRoomStateEvent(
        roomId,
        StateEventName.M_ROOM_NAME_EVENT,
        '',
      )) || {};
    return name;
  }

  private i18nOptions(
    translationContext: TranslationContext,
  ): TranslationOptions {
    return {
      lng: translationContext.locale,
      joinArrays: '',
      ...translationContext,
    };
  }

  // Try to retrieve all variables that may be useful for i18n translations
  private async getTranslationContext(
    roomId: string,
  ): Promise<TranslationContext> {
    const ctx = await this.getPrivateRoomContext(roomId);

    // fallback for the public room
    if (!ctx)
      return {
        roomId,
      };

    // get as much as we can from the private room
    const originalRoomId = ctx.originalRoomId || '';
    const originalRoomName = ctx.originalRoomName || '';
    const roomName = (await this.getRoomName(roomId)) || '';
    const userId = ctx.userId || '';
    const userDisplayName = ctx.userDisplayName || '';
    const locale = ctx.locale || this.appConfig.welcome_workflow_default_locale;

    const originalRoom: IRoom =
      await this.meetingClient.fetchRoomAsync(originalRoomId);
    const originalRoomLink = `${this.appConfig.matrix_link_share}${originalRoom.id}`;

    return {
      locale,
      roomId,
      roomName,
      originalRoomName,
      originalRoomId,
      originalRoomLink,
      userId,
      userDisplayName,
      widgetURL: this.appConfig.meetingwidget_url,
    };
  }

  /**
   *  Create the private chat room with the userId
   * @param userId
   * @param originalRoomId
   * @param roomName
   * @param topic
   * @param roomType
   */
  private async createPrivateRoom(
    roomType: RoomType,
    userId: string,
    originalRoomId: string | undefined,
    roomName: string | undefined,
    topic: string | undefined,
  ): Promise<string> {
    const initialState: any[] = [
      {
        type: StateEventName.M_ROOM_GUEST_ACCESS,
        state_key: '',
        content: { guest_access: 'forbidden' },
      },
      {
        type: StateEventName.M_ROOM_HISTORY_VISIBILITY_EVENT,
        state_key: '',
        content: { history_visibility: 'shared' },
      },
    ];

    if (roomType === RoomType.HELP_ROOM) {
      /*  private room will be tagged with a custom event  */
      initialState.push({
        type: StateEventName.NIC_MEETINGS_WELCOME_ROOM,
        state_key: this.botId,
        content: {
          userId,
          originalRoomId,
          locale: this.appConfig.welcome_workflow_default_locale,
        },
      });
    }

    const avatarUrl = await this.getWelcomeRoomAvatarUrl();
    if (roomType === RoomType.HELP_ROOM && avatarUrl) {
      initialState.push(
        iStateEventHelper.fromPartial({
          type: StateEventName.M_ROOM_AVATAR,
          state_key: '',
          content: { url: avatarUrl },
        }),
      );
    }

    const roomProps: RoomCreateOptions = {
      preset: 'trusted_private_chat',
      // invite: [userId],  // user will be invited in a different way
      initial_state: initialState,
      visibility: 'private',
      is_direct: true,
      name: roomName,
      topic,
    };

    if (roomName) roomProps.name = roomName;
    if (topic) roomProps.topic = topic;

    return await this.client.createRoom(roomProps);
  }

  private async inviteUser(
    privateRoomId: string,
    roomType: RoomType,
    userId: string,
    originalRoomId: string | undefined,
  ) {
    const ctx = await this.getTranslationContext(privateRoomId);

    const reason = i18next.t(
      'welcome.privateRoom.inviteReason',
      "In this private room bot can help with adding a NeoDateFix widget to the room '{{originalRoomName}}'.",
      this.i18nOptions(ctx),
    );
    const htmlReason = `<table><tr><td><b>${reason}</b></td></tr></table>`;
    await this.meetingClient.inviteUserToPrivateRoom(
      userId,
      privateRoomId,
      reason,
      htmlReason,
    );

    this.logger.debug(
      `inviteToPrivateRoom: ${privateRoomId}, userId: ${userId} for original room: ${originalRoomId}`,
    );
  }

  private async getWelcomeRoomAvatarUrl(): Promise<string | undefined> {
    // TODO: uncomment when icon is ready, set the right path to the icon
    // if (!this.welcomeRoomAvatar) {
    //   try {
    //     this.welcomeRoomAvatar = await this.client.uploadContent(fs.readFileSync(path.join(__dirname, '../static/images/bot_help_room.jpg')), 'image/jpg');
    //   } catch (err) {
    //     this.logger.error(extractRequestErrorForLogging(err),'Unable to set bot-help-room avatar image.');
    //   }
    // }
    return this.welcomeRoomAvatar;
  }
}
