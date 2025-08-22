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

import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import {
  MatrixClient,
  PowerLevelsEventContent,
  RoomCreateOptions,
  Space,
  SpaceEntityMap,
} from 'matrix-bot-sdk';
import { ArrayOps } from '../ArrayOps';
import { DeepReadonly, DeepReadonlyArray } from '../DeepReadOnly';
import { EventContentRenderer } from '../EventContentRenderer';
import {
  IEventContentParams,
  eventContentParams,
} from '../IEventContentParams';
import { MatrixEndpoint } from '../MatrixEndpoint';
import { MeetingCreateDto } from '../dto/MeetingCreateDto';
import { Matrix404Error } from '../error/Matrix404Error';
import { RoomNotCreatedError } from '../error/RoomNotCreatedError';
import { ISyncParams } from '../matrix/dto/ISyncParams';
import { EncryptionEventContent } from '../matrix/event/EncryptionEventContent';
import { IStateEvent, iStateEventHelper } from '../matrix/event/IStateEvent';
import { IElementMembershipEventContent } from '../model/IElementMembershipEventContent';
import { IMeetingsMetadataEventContent } from '../model/IMeetingsMetadataEventContent';
import { IRoom } from '../model/IRoom';
import { IRoomMatrixEvents } from '../model/IRoomMatrixEvents';
import { ISpaceParentEventContent } from '../model/ISpaceParentEventContent';
import { IUserContext } from '../model/IUserContext';
import { MeetingType } from '../model/MeetingType';
import { Room } from '../model/Room';
import { RoomEventName } from '../model/RoomEventName';
import { StateEventName } from '../model/StateEventName';
import { templateHelper } from '../util/TemplateHelper';
import { extractOxRrule } from '../util/extractOxRrule';
import { getForceDeletionTime } from '../util/getForceDeletionTime';
import { migrateMeetingTime } from '../util/migrateMeetingTime';

@Injectable()
export class MeetingClient {
  private logger = new Logger(MeetingClient.name);
  constructor(
    private matrixClient: MatrixClient,
    private eventContentRenderer: EventContentRenderer,
  ) {}

  private skipEventTypes = new Set(
    [
      StateEventName.M_ROOM_NAME_EVENT,
      StateEventName.M_ROOM_TOPIC_EVENT,
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT, // not used at this step
      StateEventName.M_SPACE_PARENT_EVENT,
    ].map((v) => v as string),
  );

  private modifyEventTypes = new Set(
    [
      StateEventName.M_ROOM_MEMBER_EVENT,
      StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      StateEventName.M_ROOM_ENCRYPTION,
    ].map((v) => v as string),
  );

  public async createMeeting(
    parentRoom: IRoom | undefined,
    botUser: string,
    meetingCreate: MeetingCreateDto,
    meetingType: MeetingType,
    spaceParentEventContent: ISpaceParentEventContent,
    roomMatrixEvents: DeepReadonly<IRoomMatrixEvents>,
    userContext: IUserContext,
    defaultRoomVersion: string,
    autoDeletionOffset?: number,
    messagingPowerLevel?: number,
  ): Promise<
    [string, DeepReadonlyArray<IStateEvent<IElementMembershipEventContent>>]
  > {
    const stateEvents = roomMatrixEvents.stateEvents.filter(
      (se) => !this.skipEventTypes.has(se.type),
    );

    /**
     * partitions state events into two lists:
     *  - states that could be modified based on values in meeting creation event
     *  - states that go into room creation without modification
     */
    const [configStates, configInitStates] = _.partition(stateEvents, (item) =>
      this.modifyEventTypes.has(item.type),
    );

    const params: IEventContentParams = eventContentParams.newInstance(
      undefined,
      meetingCreate.title,
    );
    const renderedRawConfigInitStates: DeepReadonlyArray<IStateEvent<unknown>> =
      this.eventContentRenderer.renderStateEvents(configInitStates, params);

    // creates event type to state events Map
    const configStateMap: Map<string, DeepReadonly<IStateEvent<unknown>>[]> =
      new ArrayOps(configStates).groupBy((item) => item.type);

    const configMemberEvents: DeepReadonly<
      IStateEvent<IElementMembershipEventContent>
    >[] =
      (configStateMap.get(StateEventName.M_ROOM_MEMBER_EVENT) as DeepReadonly<
        IStateEvent<IElementMembershipEventContent>
      >[]) ?? [];
    const configMemberSet: Set<string> = new Set(
      configMemberEvents.map((se) => se.state_key),
    );
    const powerLevelUsers: { [userId: string]: number } = {};
    let participantMemberEvents: DeepReadonly<
      IStateEvent<IElementMembershipEventContent>
    >[] = [];

    const configStateMapRoomPowerLevelsEvents = configStateMap.get(
      StateEventName.M_ROOM_POWER_LEVELS_EVENT,
    );
    const configPowerLevel: PowerLevelsEventContent | null =
      configStateMapRoomPowerLevelsEvents
        ? (configStateMapRoomPowerLevelsEvents[0]
            .content as DeepReadonly<PowerLevelsEventContent>)
        : null;

    const saveConfigUserPowerLevels = configPowerLevel?.users
      ? configPowerLevel?.users
      : {};
    if (!saveConfigUserPowerLevels[userContext.userId])
      powerLevelUsers[userContext.userId] =
        defaultRoomVersion === '12' ? 150 : 100;
    if (defaultRoomVersion !== '12' && !saveConfigUserPowerLevels[botUser])
      powerLevelUsers[botUser] = 101;

    let invites: string[] = [];
    invites.push(userContext.userId);
    const meetingParticipants = meetingCreate.participants ?? [];
    invites.push(...meetingParticipants.map((p) => p.user_id));
    invites = [...new Set<string>(invites)];

    const participantPowerLevelMap = new Map(
      meetingParticipants.map((p) => [p.user_id, p.power_level]),
    );
    participantMemberEvents = invites
      .filter((user) => !configMemberSet.has(user))
      .map((user) => {
        const content: IElementMembershipEventContent = {
          membership: 'invite',
        };
        if (!saveConfigUserPowerLevels[user]) {
          const powerLevel = participantPowerLevelMap.get(user);
          if (powerLevel && Number.isFinite(powerLevel) && powerLevel >= 0) {
            powerLevelUsers[user] = powerLevel;
          }
        }
        return iStateEventHelper.fromPartial({
          type: StateEventName.M_ROOM_MEMBER_EVENT,
          state_key: user,
          content,
        });
      });

    const { displayname } = await this.matrixClient.getUserProfile(
      userContext.userId,
    );

    // change data model if meeting is in old format
    const externalRrule = extractOxRrule(meetingCreate);
    const calendar = migrateMeetingTime(
      meetingCreate,
      externalRrule,
      undefined,
    );

    const memberEventsWithReason: DeepReadonlyArray<
      IStateEvent<IElementMembershipEventContent>
    > = [...configMemberEvents, ...participantMemberEvents]
      .filter((se) => se.state_key !== botUser)
      .map((se) => {
        const { textReason, htmlReason } = templateHelper.makeInviteReasons(
          {
            description: meetingCreate.description,
            calendar,
          },
          userContext,
          se.state_key === userContext.userId ? undefined : displayname,
        );

        const eventContentCopy: IElementMembershipEventContent =
          !!se.content['reason'] || !!se.content['io.element.html_reason']
            ? se.content
            : {
                ...se.content,
                reason: textReason,
                'io.element.html_reason': htmlReason,
              };

        const nse: IStateEvent<IElementMembershipEventContent> = {
          ...se,
          content: eventContentCopy,
        };
        return nse;
      });

    const powerLevel: PowerLevelsEventContent = {
      ...configPowerLevel,
      users: {
        ...configPowerLevel?.users,
        ...powerLevelUsers,
      },
    };

    if (messagingPowerLevel) {
      powerLevel.events_default = messagingPowerLevel;
    }

    const renderedMemberEventsWithReason: DeepReadonlyArray<
      IStateEvent<IElementMembershipEventContent>
    > = this.eventContentRenderer.renderStateEvents(
      [...memberEventsWithReason],
      params,
    );

    const meetingsMetadataEventContent: IMeetingsMetadataEventContent = {
      calendar,
      force_deletion_at: getForceDeletionTime(autoDeletionOffset, calendar),
      creator: userContext.userId,
      external_data: meetingCreate.external_data,
    };

    const initialState: IStateEvent<unknown>[] = [
      ...renderedRawConfigInitStates,
      iStateEventHelper.fromPartial({
        type: StateEventName.NIC_MEETINGS_METADATA_EVENT,
        content: meetingsMetadataEventContent,
      }),
    ];

    if (parentRoom) {
      initialState.push(
        iStateEventHelper.fromPartial({
          type: StateEventName.M_SPACE_PARENT_EVENT,
          state_key: parentRoom.id,
          content: spaceParentEventContent,
        }),
      );
    }

    const configRoomEncryption: EncryptionEventContent | undefined =
      configStateMap.get(StateEventName.M_ROOM_ENCRYPTION)?.[0]
        .content as DeepReadonly<EncryptionEventContent>;
    const parentRoomEncryption: EncryptionEventContent | undefined =
      parentRoom?.encryptionEvent?.content;

    const roomEncryption: EncryptionEventContent | undefined = [
      configRoomEncryption,
      parentRoomEncryption,
    ].find((v: EncryptionEventContent | undefined) => v !== undefined);
    if (roomEncryption) {
      initialState.push(
        iStateEventHelper.fromPartial({
          type: StateEventName.M_ROOM_ENCRYPTION,
          content: roomEncryption,
        }),
      );
    }

    const roomCreate: RoomCreateOptions = {
      name: meetingCreate.title,
      topic: meetingCreate.description,
      visibility: 'private',
      creation_content: { type: meetingType },
      preset: 'private_chat',
      initial_state: initialState,
      power_level_content_override: powerLevel,
    };

    const roomId = await this.matrixClient.createRoom(roomCreate);
    if (!roomId) {
      throw new RoomNotCreatedError();
    }

    return [roomId, renderedMemberEventsWithReason];
  }

  public async traverseRoomChildren(parentRoom: IRoom): Promise<IRoom[]> {
    const rooms: IRoom[] = [];

    const load = async (parentRoom: IRoom) => {
      const childRoomMap: SpaceEntityMap = parentRoom.spaceSubRooms;
      const childRoomIds = Object.keys(childRoomMap);

      if (childRoomIds.length !== 0) {
        const childRooms = await this.loadPartialRooms(
          childRoomIds,
          parentRoom.id,
        );

        await Promise.all(
          childRooms.map(async (child) => {
            await load(child);

            rooms.push(child);
          }),
        );
      }
    };

    await load(parentRoom);

    return rooms;
  }

  /**
   * Loads rooms by ids filtered by optional parent room id and additional state filters.
   * The content of the returned rooms is NOT complete, rooms are initialized with the content from
   * 'm.room.create', 'net.nordeck.meetings.metadata' and all state events mentioned in the filters.
   *
   * @param childRoomIds child rooms ids
   * @param parentRoomIdFilter parent room id filter
   * @param additionalFilters event type to state key filter, if specified the returned rooms are initialized with
   * the content of these event types used.
   */
  public async loadPartialRooms(
    childRoomIds: string[],
    parentRoomIdFilter?: string,
    additionalFilters?: [StateEventName, string][],
  ): Promise<IRoom[]> {
    const stateSelector: [string, string][] = [
      [StateEventName.M_ROOM_CREATION_EVENT, ''],
      [StateEventName.NIC_MEETINGS_METADATA_EVENT, ''],
    ];

    if (parentRoomIdFilter) {
      stateSelector.push([
        StateEventName.M_SPACE_PARENT_EVENT,
        parentRoomIdFilter,
      ]);
    }

    if (additionalFilters) {
      stateSelector.push(...additionalFilters);
    }

    const childRooms: IRoom[] = [];

    const errors: unknown[] = [];
    await Promise.all(
      childRoomIds.map(async (childId) => {
        try {
          const stateEvents: IStateEvent<unknown>[] = await Promise.all(
            stateSelector.map(async (tuple) => {
              const [eventType, stateKey] = tuple;
              const eventContent = await this.matrixClient.getRoomStateEvent(
                childId,
                eventType,
                stateKey,
              );

              return {
                type: eventType,
                state_key: stateKey,
                content: eventContent,
              } as IStateEvent<unknown>;
            }),
          );

          childRooms.push(new Room(childId, stateEvents));
        } catch (e) {
          if (e instanceof Matrix404Error && e.errcode === 'M_NOT_FOUND') {
            // state event not found, room filtered out
          } else if (e instanceof Error) {
            errors.push(e.message);
          } else {
            errors.push(e);
          }
        }
      }),
    );

    if (errors.length > 0) {
      throw errors;
    }

    return childRooms;
  }

  public async loadRooms(lazy: boolean, rooms?: string[]): Promise<IRoom[]> {
    const _filter = {
      event_fields: [],
      account_data: {
        types: [],
      },
      presence: {
        types: [],
      },
      room: {
        rooms,
        account_data: {
          types: [],
        },
        ephemeral: {
          types: [],
        },
        state: {
          types: [
            StateEventName.NIC_CONTROLROOM_MIGRATION_VERSION,
            StateEventName.M_ROOM_NAME_EVENT,
            StateEventName.M_ROOM_CREATION_EVENT,
            StateEventName.M_ROOM_TOPIC_EVENT,
            StateEventName.M_ROOM_MEMBER_EVENT,
            StateEventName.M_ROOM_POWER_LEVELS_EVENT,
            StateEventName.M_ROOM_ENCRYPTION,
            StateEventName.M_ROOM_GUEST_ACCESS_EVENT,
            StateEventName.M_ROOM_HISTORY_VISIBILITY_EVENT,
            StateEventName.IO_ELEMENT_WIDGETS_LAYOUT_EVENT,
            StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
            StateEventName.M_ROOM_TOMBSTONE_EVENT,
            StateEventName.NIC_MEETINGS_METADATA_EVENT,
            RoomEventName.NIC_MEETINGS_MEETING_UPDATE_DETAILS,
            RoomEventName.NIC_MEETINGS_MEETING_CREATE,
            RoomEventName.NIC_MEETINGS_MEETING_CLOSE,
            StateEventName.M_SPACE_PARENT_EVENT,
          ],
          lazy_load_members: lazy,
        },
        timeline: {
          types: [],
        },
      },
    };

    const syncParams: ISyncParams = {
      filter: JSON.stringify(_filter),
      set_presence: 'offline',
      full_state: true,
      timeout: 60000,
    };
    const syncResponse = await this.matrixClient.doRequest(
      'GET',
      MatrixEndpoint.MATRIX_CLIENT_SYNC,
      syncParams,
    );
    const roomsSection = (syncResponse || {}).rooms || {};
    const joinedRoomIds = Object.keys(roomsSection.join || {});
    const invitedRoomIds = Object.keys(roomsSection.invite || {});

    let result: IRoom[] = [];
    result = result.concat(
      this.createRoomList('join', roomsSection.join || [], joinedRoomIds),
    );
    result = result.concat(
      this.createRoomList('invite', roomsSection.invite || [], invitedRoomIds),
    );
    return result;
  }

  public createRoomList(joinType: string, rooms: any, room_ids: string[]) {
    const result: IRoom[] = [];
    for (const room_id of room_ids) {
      let events = [];
      if (joinType === 'invite') {
        events = rooms[room_id].invite_state?.events || [];
      } else {
        events = rooms[room_id].state?.events || [];
      }
      if (events.length) {
        const room: IRoom = new Room(room_id, events);
        result.push(room);
      }
    }
    return result;
  }

  public async fetchRoomAsync(room_id: string): Promise<IRoom> {
    return new Room(room_id, await this.matrixClient.getRoomState(room_id));
  }

  public async parentAddChildRoom(parentRoomId: string, roomId: string) {
    await new Space(parentRoomId, this.matrixClient).addChildRoom(roomId);
  }

  public async inviteUserToPrivateRoom(
    userId: string,
    roomId: string,
    reason: string,
    htmlReason: string,
  ) {
    // can't use 'invite' from api because it won't set is_direct=true
    const { displayname } = await this.matrixClient.getUserProfile(userId);
    await this.matrixClient.sendStateEvent(roomId, 'm.room.member', userId, {
      is_direct: true,
      membership: 'invite',
      displayname,
      reason,
      'io.element.html_reason': htmlReason,
    });
  }
}
