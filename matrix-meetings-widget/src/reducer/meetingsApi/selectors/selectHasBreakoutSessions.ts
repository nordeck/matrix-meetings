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
import { isMeetingBreakOutRoom, isMeetingRoom } from '../helpers';
import {
  makeSelectAllRoomParentEventsByParentRoomId,
  selectRoomCreateEventByRoomId,
  selectRoomCreateEventEntities,
} from '../meetingsApi';

/**
 * Select whether a room has breakout sessions
 *
 * @param roomId - the id of the meeting room
 * @returns if true, the meeting has breakout sessions
 */
export function makeSelectHasBreakoutSessions() {
  return createSelector(
    selectRoomCreateEventByRoomId,
    selectRoomCreateEventEntities,
    makeSelectAllRoomParentEventsByParentRoomId(),
    (roomCreateEvent, roomCreateEvents, roomParentEvents): boolean => {
      // check if the room is a meeting room
      if (!roomCreateEvent || !isMeetingRoom(roomCreateEvent.content.type)) {
        return false;
      }

      // check if any children is a breakout session
      return roomParentEvents.some((event) => {
        const room = roomCreateEvents[event.room_id];
        return isMeetingBreakOutRoom(room?.content?.type);
      });
    },
  );
}
