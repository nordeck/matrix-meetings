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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { createSelector } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { RoomNameEvent, RoomTopicEvent } from '../../../lib/matrix';
import {
  calculateCalendarEvents,
  isString,
  parseICalDate,
  toISOString,
} from '../../../lib/utils';
import { RootState } from '../../../store';
import {
  isMeetingBreakOutRoom,
  isMeetingRoom,
  isMeetingRoomOrBreakOutRoom,
} from '../helpers';
import {
  selectAllRoomCreateEventRoomIds,
  selectNordeckMeetingMetadataEventEntities,
  selectRoomCreateEventEntities,
  selectRoomMemberEventEntities,
  selectRoomNameEventEntities,
  selectRoomParentEventEntities,
  selectRoomTombstoneEventEntities,
  selectRoomTopicEventEntities,
} from '../meetingsApi';

export type MeetingIdEntry = {
  id: string;
  uid: string;
  recurrenceId: string | undefined;
  startTime: string;
  endTime: string;
};

export type Filters = {
  /** The inclusive start date of the filter */
  startDate: string;
  /** The inclusive end date of the filter */
  endDate: string;
  filterText?: string;
};

export type SelectAllMeetingIdsOpts = {
  isChildOfRoomId?: string;
  skipMeetings?: boolean;
  includeBreakoutSessions?: boolean;
  hasMemberId?: string;

  /**
   * If true, recurrence rules are not calculated but the dtstart end dtend
   * of the first calendar event are returned instead.
   */
  ignoreRecurrenceRulesAndDateFilters?: boolean;
};

export function makeSelectAllMeetingIds(
  opts?: SelectAllMeetingIdsOpts,
): (state: RootState, filters: Filters) => MeetingIdEntry[] {
  const {
    includeBreakoutSessions = false,
    skipMeetings = false,
    isChildOfRoomId,
    hasMemberId,
    ignoreRecurrenceRulesAndDateFilters = false,
  } = opts ?? {};

  return createSelector(
    (_state: RootState, filters: Filters) => filters,
    selectAllRoomCreateEventRoomIds,
    selectRoomParentEventEntities,
    selectRoomCreateEventEntities,
    selectRoomTombstoneEventEntities,
    selectRoomNameEventEntities,
    selectRoomTopicEventEntities,
    selectNordeckMeetingMetadataEventEntities,
    selectRoomMemberEventEntities,
    (
      filters,
      allRoomIds,
      roomParentEvents,
      roomCreateEvents,
      roomTombstoneEvents,
      roomNameEvents,
      roomTopicEvents,
      nordeckMeetingMetadataEvents,
      roomMemberEvents,
    ) => {
      function filter(roomId: string) {
        // only use the room if it is a child of the roomId
        const parentEvent = roomParentEvents[roomId];
        if (
          isChildOfRoomId &&
          (!parentEvent || parentEvent.state_key !== isChildOfRoomId)
        ) {
          return false;
        }

        // check if the room has a tombstone
        const hasTombstone = roomTombstoneEvents[roomId] !== undefined;
        if (hasTombstone) {
          return false;
        }

        // check the type of the event
        const createEvent = roomCreateEvents[roomId];
        if (
          !createEvent ||
          !isMeetingRoomOrBreakOutRoom(createEvent.content.type) ||
          (isMeetingRoom(createEvent.content.type) && skipMeetings) ||
          (isMeetingBreakOutRoom(createEvent.content.type) &&
            !includeBreakoutSessions)
        ) {
          // only one type of room at once
          return false;
        }

        // the name is required
        const roomNameEvent = roomNameEvents[roomId];
        if (typeof roomNameEvent?.content?.name !== 'string') {
          return false;
        }

        // the meeting metadata is required
        const nordeckMeetingMetadataEvent =
          nordeckMeetingMetadataEvents[roomId];
        if (!nordeckMeetingMetadataEvent) {
          return false;
        }

        // should have member
        if (
          hasMemberId &&
          !Object.values(roomMemberEvents).some(
            (e) =>
              e &&
              e.room_id === createEvent.room_id &&
              e.state_key === hasMemberId,
          )
        ) {
          return false;
        }

        return filterMeetingByText(filters, {
          roomNameEvent,
          roomTopicEvent: roomTopicEvents[roomId],
        });
      }

      const allMeetingIds = allRoomIds
        .filter(isString)
        .filter(filter)
        .flatMap<MeetingIdEntry>((roomId) => {
          const {
            content: { calendar },
          } = nordeckMeetingMetadataEvents[roomId]!;

          if (ignoreRecurrenceRulesAndDateFilters) {
            return {
              id: roomId,
              uid: calendar[0].uid,
              startTime: toISOString(parseICalDate(calendar[0].dtstart)),
              endTime: toISOString(parseICalDate(calendar[0].dtend)),
              recurrenceId: undefined,
            };
          }

          return calculateCalendarEvents({
            calendar,
            fromDate: filters.startDate,
            toDate: filters.endDate,
          }).map<MeetingIdEntry>((entry) => ({
            id: roomId,
            uid: entry.uid,
            startTime: entry.startTime,
            endTime: entry.endTime,
            recurrenceId: entry.recurrenceId,
          }));
        });

      allMeetingIds.sort((a, b) => {
        const aDate = DateTime.fromISO(a.startTime);
        const bDate = DateTime.fromISO(b.startTime);

        if (+aDate === +bDate) {
          return a.id.localeCompare(b.id, 'en');
        }

        return aDate.toMillis() - bDate.toMillis();
      });

      return allMeetingIds;
    },
  );
}

export function filterMeetingByText(
  filters: Partial<Filters>,
  data: {
    roomNameEvent: StateEvent<RoomNameEvent>;
    roomTopicEvent?: StateEvent<RoomTopicEvent>;
  },
): boolean {
  if (!filters) {
    return true;
  }

  const { roomNameEvent, roomTopicEvent } = data;

  if (filters.filterText) {
    // Simple Stupid search text for the first version
    const filterText = filters.filterText.toLowerCase();
    const title = roomNameEvent.content.name.toLowerCase();
    const description = roomTopicEvent?.content?.topic?.toLowerCase() ?? '';

    return title.includes(filterText) || description.includes(filterText);
  }

  return true;
}
