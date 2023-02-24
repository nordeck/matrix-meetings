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

import { getRoomMemberDisplayName } from '@matrix-widget-toolkit/api';
import { isEqual } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { RootState } from '../../../store';
import { isMeetingRoomOrBreakOutRoom } from '../helpers';
import {
  filterAllRoomMemberEventsByRoomId,
  selectAllRoomChildEvents,
  selectRoomCreateEventEntities,
  selectRoomMemberEventEntities,
  selectRoomNameEventByRoomId,
  selectRoomTopicEventByRoomId,
} from '../meetingsApi';
import { MeetingInvitation, MeetingParticipant } from '../types';

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

export function makeSelectInvitedMeeting(): (
  state: RootState,
  roomId: string
) => MeetingInvitation | undefined {
  return createDeepEqualSelector(
    (_: RootState, roomId: string) => roomId,
    selectAllRoomChildEvents,
    selectRoomCreateEventEntities,
    selectRoomNameEventByRoomId,
    selectRoomTopicEventByRoomId,
    selectRoomMemberEventEntities,
    (
      roomId,
      allChildEvents,
      createEvents,
      nameEvent,
      topicEvent,
      roomMemberEvents
    ) => {
      // check the type of the event
      const createEvent = createEvents[roomId];
      if (
        !createEvent ||
        !isMeetingRoomOrBreakOutRoom(createEvent.content.type)
      ) {
        return undefined;
      }

      // the name is required
      if (typeof nameEvent?.content?.name !== 'string') {
        return undefined;
      }

      const participants = filterAllRoomMemberEventsByRoomId(
        roomMemberEvents,
        createEvent.room_id
      ).map(
        (e, _, all): MeetingParticipant => ({
          userId: e.state_key,
          displayName: getRoomMemberDisplayName(e, all),
          membership: e.content.membership === 'join' ? 'join' : 'invite',
          rawEvent: e,
        })
      );

      const { room_id: parentRoomId } =
        allChildEvents
          // only events that target the given room
          .filter((e) => e.state_key === roomId)
          // only events that belong to a non-space
          .find((e) => createEvents[e.room_id]?.content?.type !== 'm.space') ??
        {};

      const meeting: MeetingInvitation = {
        meetingId: createEvent.room_id,
        type: createEvent.content.type,
        title: nameEvent?.content.name,
        description: topicEvent?.content.topic,
        participants,
        parentRoomId,
      };

      return meeting;
    }
  );
}
