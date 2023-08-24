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

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import {
  isMeetingBreakOutRoom,
  isMeetingRoom,
  isMeetingRoomOrBreakOutRoom,
} from '../helpers';
import {
  selectAllRoomChildEvents,
  selectAllRoomCreateEventRoomIds,
  selectNordeckMeetingMetadataEventEntities,
  selectRoomCreateEventEntities,
  selectRoomMemberEventEntities,
  selectRoomNameEventEntities,
} from '../meetingsApi';

export type SelectAllInvitedMeetingIdsOpts = {
  isChildOfRoomId?: string;
  skipMeetings?: boolean;
  includeBreakoutSessions?: boolean;
  hasMemberId?: string;
};

export function makeSelectAllInvitedMeetingIds(
  opts?: SelectAllInvitedMeetingIdsOpts,
): (state: RootState) => string[] {
  const {
    includeBreakoutSessions = false,
    skipMeetings = false,
    isChildOfRoomId,
    hasMemberId,
  } = opts ?? {};

  return createSelector(
    selectAllRoomCreateEventRoomIds,
    selectAllRoomChildEvents,
    selectRoomCreateEventEntities,
    selectRoomNameEventEntities,
    selectNordeckMeetingMetadataEventEntities,
    selectRoomMemberEventEntities,
    (
      allRoomIds,
      allRoomChildEvents,
      roomCreateEvents,
      roomNameEvents,
      nordeckMeetingMetadataEvents,
      roomMemberEvents,
    ) => {
      function filter(roomId: string) {
        const potentialParents = allRoomChildEvents
          // only events that target the given room
          .filter((e) => e.state_key === roomId)
          // only events that belong to a non-space
          .filter(
            (e) => roomCreateEvents[e.room_id]?.content?.type !== 'm.space',
          )
          .map((e) => e.room_id);

        // this is only a best guess. only include rooms that are either
        // owned by isChildOfRoomId or from _no other_ known room.
        if (
          isChildOfRoomId &&
          potentialParents.length > 0 &&
          !potentialParents.includes(isChildOfRoomId)
        ) {
          return false;
        }

        // there shouldn't be a meeting metadata event
        const nordeckMeetingMetadataEvent =
          nordeckMeetingMetadataEvents[roomId];
        if (nordeckMeetingMetadataEvent) {
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

        // should have invited member
        if (
          hasMemberId &&
          !Object.values(roomMemberEvents).some(
            (e) =>
              e &&
              e.room_id === createEvent.room_id &&
              e.state_key === hasMemberId &&
              e.content.membership === 'invite',
          )
        ) {
          return false;
        }

        return true;
      }

      const allMeetingIds = allRoomIds.filter(asString).filter(filter);

      sortMeetings(allMeetingIds, {
        roomNameEvents,
      });

      return allMeetingIds;
    },
  );
}

function asString(input: unknown): input is string {
  return typeof input === 'string';
}

export function sortMeetings(
  roomIds: string[],
  data: {
    roomNameEvents: ReturnType<typeof selectRoomNameEventEntities>;
  },
): void {
  const { roomNameEvents } = data;

  roomIds.sort((a, b) => {
    const aMetadata = roomNameEvents[a]!;
    const bMetadata = roomNameEvents[b]!;

    return aMetadata.content.name.localeCompare(bMetadata.content.name);
  });
}
