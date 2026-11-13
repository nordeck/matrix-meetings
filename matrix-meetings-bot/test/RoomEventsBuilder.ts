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
  APIRoomStateEvent,
  CreateEventContent,
  PowerLevelsEventContent,
} from 'matrix-bot-sdk';
import { v4 as uuiv4 } from 'uuid';
import { IMeetingsMetadataEventContent } from '../src/model/IMeetingsMetadataEventContent';
import { MeetingType } from '../src/model/MeetingType';
import { RoomEventName } from '../src/model/RoomEventName';
import { StateEventName } from '../src/model/StateEventName';

export class RoomEventsBuilder {
  private readonly room_id: string;
  private readonly parent_room_id: string | undefined | null;
  private readonly creator: string;
  private widgetTypes: string[] = [];
  private creationType = MeetingType.MEETING;

  private readonly isAMeetingRoom;

  constructor(
    creator: string,
    room_id: string,
    parent_room_id: string | undefined | null,
    isMeeting = true,
  ) {
    this.room_id = room_id;
    this.parent_room_id = parent_room_id;
    this.creator = creator;
    this.isAMeetingRoom = isMeeting;
  }

  public withWidgetType(widgetType: string) {
    this.widgetTypes.push(widgetType);
    return this;
  }

  public createPowerLevelEvent(): APIRoomStateEvent {
    return {
      type: StateEventName.M_ROOM_POWER_LEVELS_EVENT,
      room_id: this.room_id,
      sender: this.creator,
      content: {
        users: {
          [this.creator]: 100,
        },
        users_default: 0,
        events: {
          [StateEventName.NIC_MEETINGS_METADATA_EVENT]: 50,
          [StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT]: 50,
          [RoomEventName.NIC_MEETINGS_MEETING_CREATE]: 50,
          [StateEventName.M_SPACE_PARENT_EVENT]: 0,
          [StateEventName.M_SPACE_CHILD_EVENT]: 0,
        },
        events_default: 50,
        state_default: 50,
        ban: 50,
        kick: 50,
        redact: 50,
        invite: 50,
      } satisfies PowerLevelsEventContent,
      state_key: '',
      event_id: uuiv4(),
      unsigned: {},
      origin_server_ts: 0,
    };
  }

  public build(): APIRoomStateEvent[] {
    const roomEvents: APIRoomStateEvent[] = [
      this.createRoomCreationEvent(),
      this.createPowerLevelEvent(),
      ...this.createWidgets(),
    ];
    const spaceEvent = this.createSpace();
    if (spaceEvent) roomEvents.push(spaceEvent);
    if (this.isAMeetingRoom) roomEvents.push(this.createNicMeetingEvent());
    return roomEvents;
  }

  private createRoomCreationEvent(): APIRoomStateEvent {
    return {
      type: StateEventName.M_ROOM_CREATION_EVENT,
      room_id: this.room_id,
      sender: this.creator,
      content: {
        type: this.creationType,
        creator: this.creator,
      } satisfies CreateEventContent,
      state_key: '',
      event_id: uuiv4(),
      unsigned: {},
      origin_server_ts: 0,
    };
  }

  private createWidgets(): APIRoomStateEvent[] {
    const widgetEvents: APIRoomStateEvent[] = [];
    for (const widgetType of this.widgetTypes) {
      const widgetId = widgetType;
      widgetEvents.push({
        type: StateEventName.IM_VECTOR_MODULAR_WIDGETS_EVENT,
        room_id: this.room_id,
        sender: this.creator,
        content: {
          id: widgetId,
          type: widgetType,
          url: 'https://someUrl',
          name: 'WidgetName',
        },
        state_key: widgetId,
        event_id: uuiv4(),
        unsigned: {},
        origin_server_ts: 0,
      });
    }
    return widgetEvents;
  }

  private createSpace(): APIRoomStateEvent | undefined {
    if (this.parent_room_id) {
      return {
        type: StateEventName.M_SPACE_PARENT_EVENT,
        room_id: this.room_id,
        sender: this.creator,
        state_key: this.parent_room_id,
        content: {
          via: 'matrix.org',
        },
        event_id: uuiv4(),
        unsigned: {},
        origin_server_ts: 0,
      };
    } else {
      return undefined;
    }
  }

  private createNicMeetingEvent(): APIRoomStateEvent {
    return {
      type: StateEventName.NIC_MEETINGS_METADATA_EVENT,
      room_id: this.room_id,
      sender: this.creator,
      state_key: '',
      content: {
        creator: this.creator,
        calendar: [
          {
            uid: 'entry-0',
            dtstart: { tzid: 'UTC', value: '20210511T104500' },
            dtend: { tzid: 'UTC', value: '20210511T114500' },
          },
        ],
        force_deletion_at: new Date('2021-05-11T11:50:00Z').getTime(),
      } satisfies IMeetingsMetadataEventContent,
      event_id: uuiv4(),
      unsigned: {},
      origin_server_ts: 0,
    };
  }
}
