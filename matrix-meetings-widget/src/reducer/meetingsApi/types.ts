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
  RoomEvent,
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { CalendarEntry } from '@nordeck/matrix-meetings-calendar';
import { CalendarSourceEntries } from '../../lib/utils';
import { AcknowledgementResponse } from './helpers';

export type MutationResponse = {
  acknowledgement: AcknowledgementResponse;
  event: RoomEvent<unknown>;
};

export type MutationArrayResponse = {
  acknowledgements: AcknowledgementResponse[];
  events: RoomEvent<unknown>[];
};

export type MeetingParticipant = {
  userId: string;
  displayName: string;
  membership: 'invite' | 'join';
  rawEvent: StateEvent<RoomMemberStateEventContent>;
};

export type Meeting = {
  /** The type of the meeting */
  type: string;
  /** The id (=room_id) of the meeting */
  meetingId: string;
  /** The title of the meeting */
  title: string;
  /** The description of the meeting */
  description?: string;

  /** The uid of the calendar entry that this meeting is based on */
  calendarUid: string;
  /** The start of this meeting */
  startTime: string;
  /** The end of this meeting */
  endTime: string;

  /** The participants of this meeting */
  participants: MeetingParticipant[];
  /** The widgets of this meeting */
  widgets: string[];

  /** The parent of this meeting (if defined) */
  parentRoomId: string | undefined;

  /** The creator (=organzier) of this meeting */
  creator: string;

  /** The time when this room is deleted by the room reaper (if defined) */
  deletionTime?: string;

  /**
   * The calendar entries that were used to generate this event.
   *
   * If the meeting is not recurring, this will include a single entry.
   *
   * If the meeting is recurring, this will include at least one and at max two
   * entries. The first entry will be the series entry. It is the first occurrence
   * of the series with the rrule. If the meeting deviates from the series, the
   * second entry is the overriding series with the recurrence-id.
   */
  calendarEntries: CalendarSourceEntries;

  /** The id of this recurrence entry */
  recurrenceId?: string;
};

export type MeetingInvitation = {
  type: string;
  meetingId: string;
  title: string;
  // this was added with MSC3173 and might not be send by all home servers
  description?: string;

  participants: MeetingParticipant[];

  parentRoomId: string | undefined;
};

/* create meeting */
export type CreateMeetingOptions = {
  meeting: {
    title: string;
    description: string;
    calendar: CalendarEntry[];
    widgetIds: string[];
    participants: string[];
    powerLevels?: {
      messaging?: number;
    };
  };
};
/**/

/* create breakout session */
export type CreateBreakoutSessionsOptions = {
  breakoutSessions: {
    groups: Array<{ title: string; participants: string[] }>;
    description: string;
    startTime: string;
    endTime: string;
    widgetIds: string[];
  };
};
/**/

/* update meeting details */
export type UpdateMeetingDetailsOptions = {
  roomId: string;
  updates: {
    title?: string;
    description?: string;
    calendar?: CalendarEntry[];
  };
};
/**/

/* update meeting permissions */
export type UpdateMeetingPermissionsOptions = {
  roomId: string;
  powerLevels: {
    messaging: number;
  };
};
/**/
