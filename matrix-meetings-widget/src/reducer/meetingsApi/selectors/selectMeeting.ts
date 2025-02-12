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
  getRoomMemberDisplayName,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { getCalendarEvent, toISOSafe } from '@nordeck/matrix-meetings-calendar';
import { isEqual } from 'lodash-es';
import { DateTime } from 'luxon';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { NordeckMeetingMetadataEvent } from '../../../lib/matrix';
import { RootState } from '../../../store';
import { isMeetingRoomOrBreakOutRoom } from '../helpers';
import {
  filterAllRoomMemberEventsByRoomId,
  filterAllRoomWidgetEventsByRoomId,
  selectNordeckMeetingMetadataEventByRoomId,
  selectRoomCreateEventByRoomId,
  selectRoomMemberEventEntities,
  selectRoomNameEventByRoomId,
  selectRoomParentEventByRoomId,
  selectRoomTombstoneEventByRoomId,
  selectRoomTopicEventByRoomId,
  selectRoomWidgetEventEntities,
} from '../meetingsApi';
import { Meeting, MeetingParticipant } from '../types';

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

export function makeSelectMeeting(): (
  state: RootState,
  roomId: string,
  uid: string,
  recurrenceId: string | undefined,
) => Meeting | undefined {
  return createDeepEqualSelector(
    (
      _state: RootState,
      _roomId: string,
      uid: string,
      recurrenceId: string | undefined,
    ) => ({ uid, recurrenceId }),
    selectRoomParentEventByRoomId,
    selectRoomTombstoneEventByRoomId,
    selectRoomCreateEventByRoomId,
    selectRoomNameEventByRoomId,
    selectNordeckMeetingMetadataEventByRoomId,
    selectRoomTopicEventByRoomId,
    selectRoomWidgetEventEntities,
    selectRoomMemberEventEntities,
    (
      { uid, recurrenceId },
      parentEvent,
      tombstoneEvent,
      createEvent,
      nameEvent,
      meetingMetadataEvent,
      topicEvent,
      widgetEvents,
      roomMemberEvents,
    ) => {
      // check if the room has a tombstone
      const hasTombstone = tombstoneEvent !== undefined;
      if (hasTombstone) {
        return undefined;
      }

      // check the type of the event
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

      // the meeting metadata is required
      if (!meetingMetadataEvent) {
        return undefined;
      }

      const widgets = filterAllRoomWidgetEventsByRoomId(
        widgetEvents,
        createEvent.room_id,
      ).map((e) => e.state_key);

      const participants = filterAllRoomMemberEventsByRoomId(
        roomMemberEvents,
        createEvent.room_id,
      ).map(
        (e, _, all): MeetingParticipant => ({
          userId: e.state_key,
          displayName: getRoomMemberDisplayName(e, all),
          membership: e.content.membership === 'join' ? 'join' : 'invite',
          rawEvent: e,
        }),
      );

      const deletionTime = generateDeletionTime(meetingMetadataEvent);

      const calendarEvent = getCalendarEvent(
        meetingMetadataEvent.content.calendar,
        uid,
        recurrenceId,
      );

      if (!calendarEvent) {
        return undefined;
      }

      const meeting: Meeting = {
        meetingId: createEvent.room_id,
        calendarUid: calendarEvent.uid,
        type: createEvent.content.type,
        title: nameEvent?.content.name,
        description: topicEvent?.content.topic,
        startTime: calendarEvent.startTime,
        endTime: calendarEvent.endTime,
        participants,
        widgets,
        parentRoomId: parentEvent?.state_key,
        deletionTime,
        creator: meetingMetadataEvent.content.creator,
        calendarEntries: calendarEvent.entries,
        recurrenceId: calendarEvent.recurrenceId,
      };

      return meeting;
    },
  );
}

function generateDeletionTime(
  meetingMetadataEvent: StateEvent<NordeckMeetingMetadataEvent>,
): string | undefined {
  if (meetingMetadataEvent.content.force_deletion_at) {
    return toISOSafe(
      DateTime.fromMillis(meetingMetadataEvent.content.force_deletion_at),
    );
  }

  return undefined;
}
