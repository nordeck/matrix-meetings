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
import { PromisePool } from '@supercharge/promise-pool';
import { encode } from 'html-entities';
import i18next from 'i18next';
import { MatrixClient, SpaceEntityMap, UserID } from 'matrix-bot-sdk';
import { PowerLevelAction } from 'matrix-bot-sdk/lib/models/PowerLevelAction';
import { JitsiClient } from '../client/JitsiClient';
import { MeetingClient } from '../client/MeetingClient';
import { WidgetClient } from '../client/WidgetClient';
import { DeepReadonly, DeepReadonlyArray } from '../DeepReadOnly';
import { BreakoutSessionsDto } from '../dto/BreakoutSessionsDto';
import { MeetingChangeMessagingPermissionDto } from '../dto/MeetingChangeMessagingPermissionDto';
import { MeetingCloseDto } from '../dto/MeetingCloseDto';
import { MeetingCreateDto } from '../dto/MeetingCreateDto';
import { MeetingCreateResponseDto } from '../dto/MeetingCreateResponseDto';
import { MeetingParticipantsHandleDto } from '../dto/MeetingParticipantsHandleDto';
import { MeetingSharingInformationDto } from '../dto/MeetingSharingInformationDto';
import { MeetingUpdateDetailsDto } from '../dto/MeetingUpdateDetailsDto';
import { MeetingWidgetsHandleDto } from '../dto/MeetingWidgetsHandleDto';
import { SubMeetingsSendMessageDto } from '../dto/SubMeetingsSendMessageDto';
import { MeetingNotFoundError } from '../error/MeetingNotFoundError';
import { ParticipantError } from '../error/ParticipantError';
import { PermissionError } from '../error/PermissionError';
import { RoomNotFoundError } from '../error/RoomNotFoundError';
import { EventContentRenderer } from '../EventContentRenderer';
import { IAppConfiguration } from '../IAppConfiguration';
import {
  eventContentParams,
  IEventContentParams,
} from '../IEventContentParams';
import { IRoomEvent } from '../matrix/event/IRoomEvent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { IElementMembershipEventContent } from '../model/IElementMembershipEventContent';
import { IMeeting } from '../model/IMeeting';
import { IMeetingsMetadataEventContent } from '../model/IMeetingsMetadataEventContent';
import { IRoom } from '../model/IRoom';
import { IRoomMatrixEvents } from '../model/IRoomMatrixEvents';
import { ISpaceParentEventContent } from '../model/ISpaceParentEventContent';
import { IUserContext } from '../model/IUserContext';
import { IWidgetContent } from '../model/IWidgetContent';
import { MeetingCloseMethod } from '../model/MeetingCloseMethod';
import { MeetingType } from '../model/MeetingType';
import { powerLevelHelper } from '../model/PowerLevelHelper';
import { RoomEventName } from '../model/RoomEventName';
import { StateEventName } from '../model/StateEventName';
import { WidgetType } from '../model/WidgetType';
import { ModuleProviderToken } from '../ModuleProviderToken';
import {
  getForceDeletionTime,
  getMeetingEndTime,
  getMeetingStartTime,
} from '../shared';
import { extractOxRrule } from '../util/extractOxRrule';
import { IMeetingChanges, meetingChangesHelper } from '../util/IMeetingChanges';
import { migrateMeetingTime } from '../util/migrateMeetingTime';
import { templateHelper } from '../util/TemplateHelper';
import { RoomMessageService } from './RoomMessageService';
import { WidgetLayoutService } from './WidgetLayoutService';

@Injectable()
export class MeetingService {
  private logger = new Logger(MeetingService.name);

  constructor(
    private jitsiClient: JitsiClient,
    private matrixClient: MatrixClient,
    private roomMessageService: RoomMessageService,
    private meetingClient: MeetingClient,
    @Inject(ModuleProviderToken.APP_CONFIGURATION)
    private appConfig: IAppConfiguration,
    private widgetClient: WidgetClient,
    @Inject(ModuleProviderToken.ROOM_MATRIX_EVENTS)
    private roomMatrixEvents: DeepReadonly<IRoomMatrixEvents>,
    private eventContentRenderer: EventContentRenderer,
    private widgetLayoutService: WidgetLayoutService
  ) {}

  private static getBodyError(
    msg: string,
    error: any
  ): { message: string; errcode: any; error: any } {
    const body = error?.body;
    return {
      message: msg,
      errcode: body ? body.errcode : undefined,
      error: body ? body.error : error,
    };
  }

  public async changeMessagingPermissions(
    userContext: IUserContext,
    messagingPermission: MeetingChangeMessagingPermissionDto
  ): Promise<void> {
    const roomId = messagingPermission.target_room_id;
    const room: IRoom = await this.meetingClient.fetchRoomAsync(roomId);
    powerLevelHelper.assertUserHasPowerLevelFor(
      room,
      userContext.userId,
      StateEventName.M_ROOM_POWER_LEVELS_EVENT
    );
    const power_event = room.powerLevelContent;
    power_event.events_default = messagingPermission.messaging_power_level;
    await this.matrixClient.sendStateEvent(
      roomId,
      StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      '',
      power_event
    );
  }

  public async createBreakOutSessions(
    userContext: IUserContext,
    parentRoomId: string,
    breakoutSessionsCreate: BreakoutSessionsDto
  ): Promise<void> {
    for (const group of breakoutSessionsCreate.groups) {
      const meetingCreate: MeetingCreateDto = {
        ...breakoutSessionsCreate,
        parent_room_id: parentRoomId,
        title: group.title,
        participants: group.participants,
      };
      await this.createMeeting(
        userContext,
        meetingCreate,
        MeetingType.BREAKOUT_SESSION
      );
    }
  }

  public async createMeeting(
    userContext: IUserContext,
    meetingCreate: MeetingCreateDto,
    meetingType: MeetingType = MeetingType.MEETING
  ): Promise<MeetingCreateResponseDto> {
    const parentRoomId: string | undefined = meetingCreate.parent_room_id;

    // it is not possible to disable auto deletion for rooms that use a `calendar`
    const enableAutoDeletion: boolean =
      (meetingCreate.enable_auto_deletion ?? true) ||
      meetingCreate.calendar !== undefined;
    const autoDeletionOffset: number | undefined = enableAutoDeletion
      ? this.appConfig.auto_deletion_offset
      : undefined;

    const botUser: string = await this.matrixClient.getUserId();
    const parentRoom: IRoom | undefined = parentRoomId
      ? await this.meetingClient.fetchRoomAsync(parentRoomId)
      : undefined;

    const spaceParentEventContent: ISpaceParentEventContent = {
      via: [new UserID(await this.matrixClient.getUserId()).domain],
    };

    const [roomId, renderedMemberEventsWithReason]: [
      string,
      DeepReadonlyArray<IStateEvent<IElementMembershipEventContent>>
    ] = await this.meetingClient.createMeeting(
      parentRoom,
      botUser,
      meetingCreate,
      meetingType,
      spaceParentEventContent,
      this.roomMatrixEvents,
      userContext,
      autoDeletionOffset
    );

    const promises: Promise<any>[] = [];
    for (const me of renderedMemberEventsWithReason) {
      promises.push(
        this.matrixClient.sendStateEvent(
          roomId,
          me.type,
          me.state_key,
          me.content
        )
      );
    }

    const widgetIds = meetingCreate.widget_ids || [
      ...this.roomMatrixEvents.defaultWidgetIds,
    ];
    promises.push(
      this.setupWidgets(meetingType, roomId, meetingCreate, widgetIds)
    );

    promises.push(this.setUpWidgetLayoutConfiguration(roomId, widgetIds));

    const newParams: IEventContentParams = eventContentParams.newInstance(
      roomId,
      meetingCreate.title
    );
    const renderedRoomEvents = this.eventContentRenderer.renderRoomEvents(
      this.roomMatrixEvents.roomEvents,
      newParams
    );
    promises.push(this.sendRoomEvents(renderedRoomEvents, roomId));

    await Promise.all(promises);

    if (
      parentRoom &&
      powerLevelHelper.userHasPowerLevelFor(
        parentRoom,
        botUser,
        StateEventName.M_SPACE_CHILD_EVENT
      )
    ) {
      await this.meetingClient.parentAddChildRoom(parentRoom.id, roomId);
    }

    return new MeetingCreateResponseDto(
      roomId,
      `${this.appConfig.matrix_link_share}${roomId}`
    );
  }

  private async sendRoomEvents(
    renderedRoomEvents: ReadonlyArray<DeepReadonly<IRoomEvent<unknown>>>,
    roomId: string
  ) {
    for (const roomEvent of renderedRoomEvents) {
      await this.matrixClient.sendEvent(
        roomId,
        roomEvent.type,
        roomEvent.content
      );
    }
  }

  /**
   * Send state event to apply layouts for provided _widgetIds_.
   * If the custom layout config for the provided widget combination is not found, then no layouts will be applied.
   * @param roomId room id
   * @param widgetIds - ids (state keys) for widgets in the meeting
   * @private
   */
  private async setUpWidgetLayoutConfiguration(
    roomId: string,
    widgetIds?: string[]
  ): Promise<void> {
    if (!widgetIds || widgetIds.length === 0) return;

    const content =
      this.widgetLayoutService.renderWidgetLayoutEventContent(widgetIds);
    if (content) {
      await this.matrixClient.sendStateEvent(
        roomId,
        StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
        '',
        content
      );
    }
  }

  private async setupWidgets(
    meetingType: MeetingType,
    roomId: string,
    meetingCreate: MeetingCreateDto,
    widgetIds: string[]
  ): Promise<void> {
    // add the Breakout Session widget
    if (meetingType === MeetingType.MEETING) {
      await this.widgetClient.createBreakoutSessionWidgetAsync(roomId);
    }

    // add the Cockpit widget in every meeting
    await this.widgetClient.createOrUpdateMeetingCockpitWidget(roomId);

    for (const widgetId of widgetIds) {
      await this.widgetClient.createOrUpdateCustomConfiguredWidget(
        roomId,
        meetingCreate.title,
        widgetId,
        undefined
      );
    }
  }

  private async cleanupWidgets(
    widgetIds: string[] | undefined,
    room: IRoom,
    userContext: IUserContext
  ): Promise<void> {
    const promises: Promise<any>[] = [];
    const unClearableWidgets: string[] = [];
    for (const key of this.roomMatrixEvents.allWidgetIds) {
      if (widgetIds && !widgetIds.includes(key)) {
        const widgetContent: IStateEvent<IWidgetContent> | undefined =
          room.widgetEventById(key);
        if (widgetContent) {
          try {
            promises.push(
              this.matrixClient.sendStateEvent(
                room.id,
                StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
                widgetContent.state_key,
                {}
              )
            );
          } catch (err) {
            unClearableWidgets.push(widgetContent.state_key);
            this.logger.error(
              err,
              'could not delete widget in room %s with state_key %s %s %o ',
              room.id,
              widgetContent.state_key,
              userContext
            );
          }
        }
      }
    }
    if (unClearableWidgets.length > 0) {
      throw new Error(
        `Could not clear the following widgets: ${unClearableWidgets.join(
          ', '
        )}`
      );
    }
    await Promise.all(promises);
  }

  public async updateMeetingDetails(
    userContext: IUserContext,
    meetingDetails: MeetingUpdateDetailsDto
  ): Promise<void> {
    const roomId = meetingDetails.target_room_id;
    const room = await this.meetingClient.fetchRoomAsync(roomId);

    if (!room) {
      throw new RoomNotFoundError(roomId);
    }
    if (!room.meeting) {
      throw new MeetingNotFoundError(room.id);
    }

    powerLevelHelper.assertUserHasPowerLevelFor(
      room,
      userContext.userId,
      StateEventName.M_ROOM_NAME_EVENT,
      StateEventName.M_ROOM_TOPIC_EVENT,
      RoomEventName.M_ROOM_MESSAGE,
      StateEventName.NIC_MEETINGS_METADATA_EVENT,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT
    );

    const oldMeeting = room.meeting;
    const newMeeting: IMeeting = { ...room.meeting };

    // change data model if meeting is OX with non-empty rrules
    const { start_time, end_time, calendar } = migrateMeetingTime(
      meetingDetails,
      extractOxRrule(meetingDetails)
    );

    newMeeting.calendar = calendar ?? newMeeting.calendar;

    // TODO: Include the recurrence information in the update notifications (PB-2991)

    newMeeting.startTime =
      getMeetingStartTime(start_time, calendar) ?? newMeeting.startTime;
    newMeeting.endTime =
      getMeetingEndTime(end_time, calendar) ?? newMeeting.endTime;
    newMeeting.title = meetingDetails.title ?? newMeeting.title;
    newMeeting.description =
      meetingDetails.description ?? newMeeting.description;
    newMeeting.externalData =
      meetingDetails.external_data ?? newMeeting.externalData;

    const meetingChanges = meetingChangesHelper.calculate(
      oldMeeting,
      newMeeting
    );

    // The newMeeting.creator is the sender... the room.creator is often the bot. therefore remember the sender as creator
    // ==> creator is not necessarily identical to the event's creator field. If the content event gets updated by another moderator it should still represent the original creator of the newMeeting.
    const content: IMeetingsMetadataEventContent = {
      creator: newMeeting.creator,
      start_time: calendar === undefined ? newMeeting.startTime : undefined,
      end_time: calendar === undefined ? newMeeting.endTime : undefined,
      calendar:
        start_time === undefined && end_time === undefined
          ? newMeeting.calendar
          : undefined,
      auto_deletion_offset:
        newMeeting.calendar === undefined
          ? room.meeting.autoDeletionOffset
          : undefined,
      force_deletion_at: getForceDeletionTime(
        this.appConfig.auto_deletion_offset,
        newMeeting.calendar
      ),
      external_data: newMeeting.externalData,
    };

    await this.matrixClient.sendStateEvent(
      room.id,
      StateEventName.NIC_MEETINGS_METADATA_EVENT,
      '',
      content
    );

    await this.updateTitleAndInvitations(
      userContext,
      meetingChanges,
      room,
      newMeeting
    );

    const promises: Promise<any>[] = [];

    if (
      newMeeting.description !== undefined &&
      meetingChanges.descriptionChanged
    ) {
      promises.push(
        this.matrixClient.sendStateEvent(
          room.id,
          StateEventName.M_ROOM_TOPIC_EVENT,
          '',
          { topic: newMeeting.description }
        )
      );
    }

    for (const widgetId of room.meeting.widgetIds) {
      const widgetEventContent = room.widgetEventById(widgetId)?.content;
      promises.push(
        this.widgetClient.createOrUpdateCustomConfiguredWidget(
          room.id,
          newMeeting.title,
          widgetId,
          widgetEventContent
        )
      );
    }

    await Promise.all(promises);

    const botUser: string = await this.matrixClient.getUserId();
    if (
      meetingChanges.anythingChanged &&
      powerLevelHelper.userHasPowerLevelFor(
        room,
        botUser,
        RoomEventName.M_ROOM_MESSAGE
      )
    ) {
      await this.roomMessageService.notifyMeetingTimeChangedAsync(
        userContext,
        oldMeeting,
        newMeeting,
        meetingChanges,
        roomId
      );
    }
    this.logger.debug(`updated a room with id ${room.id}`);
  }

  private async updateTitleAndInvitations(
    userContext: IUserContext,
    meetingChanges: IMeetingChanges,
    room: IRoom,
    newMeeting: IMeeting
  ): Promise<void> {
    if (meetingChanges.titleChanged) {
      await this.matrixClient.sendStateEvent(
        room.id,
        StateEventName.M_ROOM_NAME_EVENT,
        '',
        { name: newMeeting.title }
      );
    }

    const memberInviteEvents = room
      .roomMemberEvents()
      .filter((me) => me.content.membership === 'invite');

    if (
      (meetingChanges.titleChanged ||
        meetingChanges.descriptionChanged ||
        meetingChanges.timeChanged) &&
      room.meeting
    ) {
      const meetingCreator = room.meeting.creator;
      const { displayname } = await this.matrixClient.getUserProfile(
        meetingCreator
      );

      await Promise.all(
        memberInviteEvents.map((me) => {
          const { textReason, htmlReason } = templateHelper.makeInviteReasons(
            {
              description: newMeeting.description,
              startTime: newMeeting.startTime,
              endTime: newMeeting.endTime,
            },
            userContext,
            displayname,
            me.state_key === meetingCreator
          );

          const mec = me.content as IElementMembershipEventContent;

          // if reason is not changed, but need to send invite because title changed
          // then add/remove whitespace for the reason for element to update invite in UI
          const newTextReason =
            mec.reason && textReason === mec.reason
              ? `${textReason} `
              : textReason;

          const newEventContent: IElementMembershipEventContent = {
            ...me.content,
            reason: newTextReason,
            'io.element.html_reason': htmlReason,
          };

          return this.matrixClient.sendStateEvent(
            room.id,
            StateEventName.M_ROOM_MEMBER_EVENT,
            me.state_key,
            newEventContent
          );
        })
      );
    }
  }

  public async handleWidgets(
    userContext: IUserContext,
    data: MeetingWidgetsHandleDto
  ): Promise<void> {
    const { target_room_id: roomId, widget_ids: eventWidgetIds, add } = data;

    const room = await this.meetingClient.fetchRoomAsync(roomId);
    if (!room) {
      throw new RoomNotFoundError(roomId);
    }
    if (!room.meeting) {
      throw new MeetingNotFoundError(roomId);
    }

    powerLevelHelper.assertUserHasPowerLevelFor(
      room,
      userContext.userId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
      StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT
    );

    const widgetIdsSet = new Set(room.meeting.widgetIds);

    let changesMade = false;
    if (add) {
      for (const widgetId of eventWidgetIds) {
        if (widgetIdsSet.has(widgetId)) continue;
        widgetIdsSet.add(widgetId);
        changesMade = true;
      }
    } else {
      for (const widgetId of eventWidgetIds) {
        if (!widgetIdsSet.has(widgetId)) continue;
        widgetIdsSet.delete(widgetId);
        changesMade = true;
      }
    }

    // now we have all widgets that should stay after remove or are added
    if (changesMade) {
      const cockpitWidgetEvent = room.widgetEventByType(WidgetType.COCKPIT);
      if (!cockpitWidgetEvent) {
        await this.widgetClient.createOrUpdateMeetingCockpitWidget(roomId);
      }

      const widgetIds = [...widgetIdsSet];

      const promises: Promise<any>[] = [];
      for (const widgetId of widgetIds) {
        const widgetEventContent = room.widgetEventById(widgetId)?.content;
        promises.push(
          this.widgetClient.createOrUpdateCustomConfiguredWidget(
            roomId,
            room.meeting.title,
            widgetId,
            widgetEventContent
          )
        );
      }

      promises.push(this.cleanupWidgets(widgetIds, room, userContext));
      await Promise.all(promises);
    }
  }

  public async handleParticipants(
    userContext: IUserContext,
    data: MeetingParticipantsHandleDto
  ): Promise<void> {
    const { target_room_id: roomId, invite, userIds } = data;

    const room = await this.meetingClient.fetchRoomAsync(roomId);
    if (!room) {
      throw new RoomNotFoundError(roomId);
    }
    if (!room.meeting) {
      throw new MeetingNotFoundError(roomId);
    }

    powerLevelHelper.assertUserHasPowerLevelFor(
      room,
      userContext.userId,
      RoomEventName.NIC_MEETINGS_MEETING_PARTICIPANTS_HANDLE
    );
    const action = invite ? PowerLevelAction.Invite : PowerLevelAction.Kick;
    powerLevelHelper.assertUserHasPowerLevelForAction(
      room,
      userContext.userId,
      action
    );

    if (action === PowerLevelAction.Kick) {
      const userContextPowerLevel = powerLevelHelper.calculateUserPowerLevel(
        room.powerLevelContent,
        userContext.userId
      );
      const powerUserId = userIds.find((userId) => {
        const userPowerLevel = powerLevelHelper.calculateUserPowerLevel(
          room.powerLevelContent,
          userId
        );
        return userContextPowerLevel <= userPowerLevel;
      });

      if (powerUserId) {
        throw new PermissionError(
          `User ${userContext.userId} has not enough power level to kick ${powerUserId}`
        );
      }
    }

    const failedUserIds: string[] = [];
    if (userIds) {
      const uniqueUserIds = [
        ...new Set(Array.isArray(userIds) ? userIds : [userIds]),
      ];
      const promises: Promise<any>[] = [];
      for (const userId of uniqueUserIds) {
        if (invite) {
          promises.push(
            this.matrixClient
              .inviteUser(userId, room.id)
              .catch(() => failedUserIds.push(userId))
          );
        } else {
          const message = i18next.t(
            'meeting.user.kicked',
            'User {{userId}} has been removed by {{sender}}',
            {
              lng: userContext.locale,
              userId,
              sender: userContext.userId,
            }
          );
          promises.push(
            this.matrixClient
              .kickUser(userId, room.id, message)
              .catch(() => failedUserIds.push(userId))
          );
        }
      }

      await Promise.all(promises);

      if (failedUserIds.length > 0) {
        throw new ParticipantError(failedUserIds);
      }
    }
  }

  public async closeMeeting(
    userContext: IUserContext,
    meetingClose: MeetingCloseDto
  ) {
    const meetingCloseMethod =
      meetingClose.method ?? MeetingCloseMethod.TOMBSTONE;
    const currentRoom: IRoom = await this.meetingClient.fetchRoomAsync(
      meetingClose.target_room_id
    );

    powerLevelHelper.assertUserHasPowerLevelFor(
      currentRoom,
      userContext.userId,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT
    );
    if (meetingCloseMethod === MeetingCloseMethod.TOMBSTONE) {
      powerLevelHelper.assertUserHasPowerLevelFor(
        currentRoom,
        userContext.userId,
        StateEventName.M_ROOM_TOMBSTONE_EVENT
      );
    } else if (
      meetingCloseMethod === MeetingCloseMethod.KICK_ALL_PARTICIPANTS
    ) {
      powerLevelHelper.assertUserHasPowerLevelForAction(
        currentRoom,
        userContext.userId,
        PowerLevelAction.Kick
      );
    } else {
      throw new Error(`unexpected meeting close method: ${meetingCloseMethod}`);
    }

    if (currentRoom && currentRoom.meeting) {
      const subRooms: IRoom[] = await this.meetingClient.traverseRoomChildren(
        currentRoom
      );
      await this.closeRooms(
        userContext,
        subRooms.map((sr) => sr.id),
        currentRoom,
        meetingCloseMethod,
        currentRoom.meeting.parentRoomId,
        userContext.locale
      );
    } else {
      throw new MeetingNotFoundError(meetingClose.target_room_id);
    }
  }

  private async closeRooms(
    userContext: IUserContext,
    childrenRoomIds: string[],
    currentRoom: IRoom,
    meetingCloseMethod: MeetingCloseMethod,
    replacementRoomId: string | undefined,
    locale: string
  ): Promise<void> {
    const botUser: string = await this.matrixClient.getUserId();
    const totalRoomIds = [...childrenRoomIds, currentRoom.id];
    const concurrentThreads: number = Math.min(totalRoomIds.length, 20);
    if (concurrentThreads <= 0) {
      this.logger.verbose(
        `No rooms to remove user ${userContext.userId} replacementRoomId ${replacementRoomId}`
      );
    } else {
      const errors: Error[] = [];
      const pool = PromisePool.withConcurrency(concurrentThreads)
        .for(totalRoomIds)
        .handleError(async (rawError) => {
          errors.push(rawError);
          return;
        });
      await pool.process(async (roomId) => {
        const room =
          roomId === currentRoom.id
            ? currentRoom
            : await this.meetingClient.fetchRoomAsync(roomId);
        const widgetEvents: IStateEvent<IWidgetContent>[] =
          room.widgetEvents(true);
        const errorsInRoom: { message: string; errcode: any; error: any }[] =
          [];

        const canManipulateWidgets = powerLevelHelper.userHasPowerLevelFor(
          room,
          userContext.userId,
          StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT
        );
        if (meetingCloseMethod === MeetingCloseMethod.TOMBSTONE) {
          powerLevelHelper.assertUserHasPowerLevelFor(
            room,
            userContext.userId,
            StateEventName.M_ROOM_TOMBSTONE_EVENT
          );
        } else if (
          meetingCloseMethod === MeetingCloseMethod.KICK_ALL_PARTICIPANTS
        ) {
          powerLevelHelper.assertUserHasPowerLevelForAction(
            room,
            userContext.userId,
            PowerLevelAction.Kick
          );
        } else {
          throw new Error(
            `unexpected meeting close method: ${meetingCloseMethod}`
          );
        }

        if (canManipulateWidgets) {
          await Promise.all(
            widgetEvents.map(async (widgetEvent) => {
              try {
                await this.matrixClient.sendStateEvent(
                  room.id,
                  StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
                  widgetEvent.content.id,
                  {}
                );
              } catch (err) {
                errorsInRoom.push(
                  MeetingService.getBodyError(
                    `closeRooms: can not remove widget of type ${widgetEvent.content.type} for room ${room.id}`,
                    err
                  )
                );
              }
            })
          );

          const message = i18next.t(
            'meeting.room.notification.closed.message',
            'Room was closed by administrator',
            { locale }
          );

          try {
            if (
              meetingCloseMethod === MeetingCloseMethod.KICK_ALL_PARTICIPANTS
            ) {
              const participants: string[] = room.meeting?.participants ?? [];
              const uniqueParticipants = [...new Set<string>(participants)];
              const uniqueParticipantsWithoutBot = uniqueParticipants.filter(
                (p) => p !== botUser
              );
              await Promise.all(
                uniqueParticipantsWithoutBot.map(async (userId) => {
                  await this.matrixClient.kickUser(userId, room.id, message);
                })
              );
            }
          } catch (err) {
            errorsInRoom.push(
              MeetingService.getBodyError(
                'closeRooms: error during users kicking',
                err
              )
            );
          }

          try {
            if (meetingCloseMethod === MeetingCloseMethod.TOMBSTONE) {
              await this.matrixClient.sendStateEvent(
                room.id,
                StateEventName.M_ROOM_TOMBSTONE_EVENT,
                '',
                {
                  body: message,
                  replacement_room: replacementRoomId,
                }
              );
            }
          } catch (err) {
            errorsInRoom.push(
              MeetingService.getBodyError(
                `closeRooms: can not tombstone room ${room.id} with replacementRoomId ${replacementRoomId}`,
                err
              )
            );
          }
        }
        if (errorsInRoom.length > 0) {
          throw errorsInRoom;
        } else {
          await this.matrixClient.leaveRoom(room.id);
        }
      });
      if (errors.length > 0) {
        throw errors;
      }
    }
  }

  public async subMeetingsSendMessage(
    userContext: IUserContext,
    data: SubMeetingsSendMessageDto
  ): Promise<void> {
    const { target_room_id: parentRoomId, message } = data;
    const parentRoom: IRoom = await this.meetingClient.fetchRoomAsync(
      parentRoomId
    );

    const childRoomMap: SpaceEntityMap = parentRoom.spaceSubRooms;
    const childRoomIds = Object.keys(childRoomMap);

    const additionalFilters: [StateEventName, string][] = [
      [StateEventName.M_ROOM_POWER_LEVELS_EVENT, ''],
    ];
    const childRooms = await this.meetingClient.loadPartialRooms(
      childRoomIds,
      parentRoomId,
      additionalFilters
    );

    if (childRooms.length <= 0) return;

    const { displayname } = await this.matrixClient.getUserProfile(
      userContext.userId
    );
    const encodedMessage = encode(message);
    const pool = PromisePool.withConcurrency(
      Math.min(childRooms.length, 20)
    ).for(childRooms);
    const { errors } = await pool.process(async (room) => {
      if (
        powerLevelHelper.userHasPowerLevelFor(
          room,
          userContext.userId,
          RoomEventName.M_ROOM_MESSAGE
        )
      ) {
        return await this.matrixClient.sendHtmlNotice(
          room.id,
          `<b>${displayname}:</b> ${encodedMessage}`
        );
      }
    });
    if (errors.length) {
      const messages: string[] = errors.map(
        (err) => `Can not send message to roomId ${err.item.id}  ${err.message}`
      );
      this.logger.error(
        `Unable to send messages to sub rooms. Finished with ${
          errors.length
        } errors. Wanted to send a message to ${
          childRooms.length
        } rooms. Errors:  ${messages.toString()}`
      );
    }
  }

  public async getSharingInformationAsync(
    room_id: string
  ): Promise<MeetingSharingInformationDto> {
    const room = await this.meetingClient.fetchRoomAsync(room_id);
    if (!room || !room.meeting) {
      throw new RoomNotFoundError(room_id);
    }
    // TODO if this is configured and remove the check of jitsi.
    // Jitsi s not done by ourself. so check, if the information is needed or not. does not depend on the current jitsi in this room. provide information if is ordered!
    // Remove Jitsi from  NordeckInternalWidgetDefinitions.JITSI
    // does not matter if the room has jitsi or not.... const hasJitsi = room.widgetEventById(NordeckInternalWidgetDefinitions.JITSI[0]);
    // if not configured there will be a null | undefined else the requested value ?!
    return this.jitsiClient.getSharingInformationAsync(room_id);
  }
}
