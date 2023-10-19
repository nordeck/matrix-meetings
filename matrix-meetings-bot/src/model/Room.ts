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

import { Logger } from '@nestjs/common';
import {
  MembershipEventContent,
  PowerLevelsEventContent,
  RoomNameEventContent,
  RoomTopicEventContent,
  SpaceChildEvent,
  SpaceChildEventContent,
  SpaceEntityMap,
} from 'matrix-bot-sdk';
import { ICreationContent } from '../matrix/dto/ICreationContent';
import { EncryptionEventContent } from '../matrix/event/EncryptionEventContent';
import { IStateEvent } from '../matrix/event/IStateEvent';
import { migrateMeetingTime } from '../util/migrateMeetingTime';
import { IMeeting } from './IMeeting';
import { IMeetingsMetadataEventContent } from './IMeetingsMetadataEventContent';
import { IRoom } from './IRoom';
import { IRoomMember } from './IRoomMember';
import { IWidgetContent } from './IWidgetContent';
import { MeetingType } from './MeetingType';
import { RoomMembership } from './RoomMembership';
import { StateEventName } from './StateEventName';
import { WidgetType } from './WidgetType';

export class Room implements IRoom {
  private logger = new Logger(Room.name);

  private _events: IStateEvent<unknown>[];
  private _room_id: string;
  private _meeting?: IMeeting;
  private _meetingInitialised = false;

  constructor(room_id: string, events: IStateEvent<unknown>[]) {
    this._events = events;
    this._room_id = room_id;
  }

  get id() {
    return this._room_id;
  }

  get title(): string {
    return (
      this.roomEventsByName(StateEventName.M_ROOM_NAME_EVENT)[0]
        ?.content as RoomNameEventContent
    )?.name;
  }

  get meeting(): IMeeting | undefined {
    if (this._meetingInitialised) {
      return this._meeting;
    }

    try {
      const roomCreate = this.roomEventsByName(
        StateEventName.M_ROOM_CREATION_EVENT,
      )[0] as IStateEvent<ICreationContent>;
      const content = this.roomEventsByName(
        StateEventName.NIC_MEETINGS_METADATA_EVENT,
      )[0]?.content as IMeetingsMetadataEventContent;
      const spaceParent = this.roomEventsByName(
        StateEventName.M_SPACE_PARENT_EVENT,
      )[0];
      if (roomCreate && content) {
        const meetingType = roomCreate.content?.type;
        const isMeeting =
          meetingType === MeetingType.MEETING ||
          meetingType === MeetingType.BREAKOUT_SESSION;

        if (!meetingType || !isMeeting) {
          return undefined;
        }

        this._meeting = {
          type: meetingType,
          roomId: this._room_id,
          creator: content.creator,
          parentRoomId: spaceParent?.state_key,
          calendar:
            content.calendar ??
            migrateMeetingTime({
              start_time: content.start_time,
              end_time: content.end_time,
            }),
          autoDeletionOffset: content.auto_deletion_offset,
          title: (
            this.roomEventsByName(StateEventName.M_ROOM_NAME_EVENT)[0]
              ?.content as RoomNameEventContent
          )?.name,
          description: (
            this.roomEventsByName(StateEventName.M_ROOM_TOPIC_EVENT)[0]
              ?.content as RoomTopicEventContent
          )?.topic,
          widgetIds: this.widgetEvents(true).map((e) => e.content.id),
          participants: this.participants([]),
          externalData: content.external_data,
        };
      }
    } finally {
      this._meetingInitialised = true;
    }
    return this._meeting;
  }

  public roomEventsByName(eventName: string): IStateEvent<unknown>[] {
    return this._events.filter((event) => event.type === eventName);
  }

  public roomMemberEvents(): IStateEvent<MembershipEventContent>[] {
    return this.roomEventsByName(
      StateEventName.M_ROOM_MEMBER_EVENT,
    ) as IStateEvent<MembershipEventContent>[];
  }

  private powerLevels(): { [userId: string]: number } | null {
    const powerLevel = (
      this.roomEventsByName(StateEventName.M_ROOM_POWER_LEVELS_EVENT)[0]
        ?.content as PowerLevelsEventContent
    )?.users;
    return powerLevel ?? null;
  }

  private roomMembers(fetchPowerLevel: boolean): IRoomMember[] {
    const levels = fetchPowerLevel ? this.powerLevels() : undefined;
    const members: IRoomMember[] = [];
    const memberEvents: any[] = this.roomEventsByName(
      StateEventName.M_ROOM_MEMBER_EVENT,
    );
    for (const event of memberEvents) {
      const content = event.content as MembershipEventContent;
      const memberUser = event.state_key;
      const member = {
        user: memberUser,
        powerLevel: levels ? levels[memberUser] : undefined,
        membershipEventContent: content,
      } as IRoomMember;
      members.push(member);
    }
    return members;
  }

  public get spaceSubRooms(): SpaceEntityMap {
    const mapping: SpaceEntityMap = {};
    this._events
      .filter((s) => s.type === StateEventName.M_SPACE_CHILD_EVENT)
      .filter((s) => (s.content as SpaceChildEventContent)?.via)
      .map((s) => (mapping[s.state_key] = new SpaceChildEvent(s)));
    return mapping;
  }

  public widgetEvents(
    removeEventsWithoutContentType: boolean,
  ): IStateEvent<IWidgetContent>[] {
    let events = this.roomEventsByName(
      StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
    ) as IStateEvent<IWidgetContent>[];
    if (removeEventsWithoutContentType) {
      events = events.filter((event) => event.content.type !== undefined);
    }
    for (const event of events) {
      if (event.content.id !== event.state_key) {
        this.logger.warn(
          `Mismatch for widget content.id: ${event.content.id}, state_key: ${event.state_key}, eventId: ${event.event_id}`,
        );
      }
      event.content.id = event.state_key;
    }
    return events;
  }

  public get encryptionEvent():
    | IStateEvent<EncryptionEventContent>
    | undefined {
    return this.roomEventsByName(
      StateEventName.M_ROOM_ENCRYPTION,
    )[0] as IStateEvent<EncryptionEventContent>;
  }

  private findWidgetEvent(
    predicate: (event: IStateEvent<IWidgetContent>) => boolean,
  ): IStateEvent<IWidgetContent> | undefined {
    return this.widgetEvents(true).find(predicate);
  }

  public widgetEventById(
    widgetId: string,
  ): IStateEvent<IWidgetContent> | undefined {
    return this.findWidgetEvent(
      (event: IStateEvent<IWidgetContent>) => event.content?.id === widgetId,
    );
  }

  private participants(toIgnore: string[]): string[] {
    const memberEvents: any[] = this.roomEventsByName(
      StateEventName.M_ROOM_MEMBER_EVENT,
    );
    const participants = memberEvents.filter((event) => {
      return (
        (event.content.membership === RoomMembership.INVITE ||
          event.content.membership === RoomMembership.JOIN) &&
        !toIgnore.includes(event.state_key)
      );
    });
    return participants.map((p) => p.state_key);
  }

  public roomMemberMap(toIgnore: string[]): Map<string, IRoomMember> {
    const roomMembers: IRoomMember[] = this.roomMembers(true);
    const result: Map<string, IRoomMember> = new Map();
    roomMembers.forEach((roomMember) => {
      if (
        (roomMember.membershipEventContent.membership ===
          RoomMembership.INVITE ||
          roomMember.membershipEventContent.membership ===
            RoomMembership.JOIN) &&
        !toIgnore.includes(roomMember.user)
      ) {
        result.set(roomMember.user, roomMember);
      } else {
        this.logger.verbose(
          `roomMemberMap: leave out ${JSON.stringify(roomMember)}`,
        );
      }
    });
    return result;
  }

  public get powerLevelContent(): PowerLevelsEventContent {
    return this.roomEventsByName(StateEventName.M_ROOM_POWER_LEVELS_EVENT)[0]
      ?.content as PowerLevelsEventContent;
  }

  public widgetEventByType(
    widgetType: WidgetType,
  ): IStateEvent<IWidgetContent> | undefined {
    return this.findWidgetEvent(
      (event: IStateEvent<IWidgetContent>) =>
        event?.content?.type === widgetType,
    );
  }
}
