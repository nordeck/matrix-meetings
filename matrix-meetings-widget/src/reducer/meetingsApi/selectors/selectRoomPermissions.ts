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
  PowerLevelsStateEvent,
  STATE_EVENT_POWER_LEVELS,
  StateEvent,
  StateEventCreateContent,
  hasActionPower,
  hasRoomEventPower,
  hasStateEventPower,
} from '@matrix-widget-toolkit/api';
import { createSelector } from '@reduxjs/toolkit';
import {
  STATE_EVENT_NORDECK_MEETING_METADATA,
  STATE_EVENT_ROOM_NAME,
  STATE_EVENT_ROOM_TOMBSTONE,
  STATE_EVENT_ROOM_TOPIC,
  STATE_EVENT_WIDGETS,
} from '../../../lib/matrix';
import { RootState } from '../../../store';
import { RoomEvents } from '../RoomEvents';
import {
  selectRoomCreateEventByRoomId,
  selectRoomPowerLevelsEventByRoomId,
} from '../meetingsApi';

export function hasPermissions(
  event: StateEvent<PowerLevelsStateEvent> | undefined,
  createEvent: StateEvent<StateEventCreateContent> | undefined,
  userId: string | undefined,
  {
    roomEventTypes = [],
    stateEventTypes = [],
    actions = [],
  }: {
    roomEventTypes?: string[];
    stateEventTypes?: string[];
    actions?: Array<'invite' | 'kick'>;
  },
): boolean {
  for (const eventType of roomEventTypes) {
    if (!hasRoomEventPower(event?.content, createEvent, userId, eventType)) {
      return false;
    }
  }

  for (const eventType of stateEventTypes) {
    if (!hasStateEventPower(event?.content, createEvent, userId, eventType)) {
      return false;
    }
  }

  for (const action of actions) {
    if (!hasActionPower(event?.content, createEvent, userId, action)) {
      return false;
    }
  }

  return true;
}

export type RoomPermissions = {
  canCreateMeeting: boolean;
  canCreateBreakoutSessions: boolean;
  canSendMessageToAllBreakoutSessions: boolean;
  canUpdateMeetingDetails: boolean;
  canUpdateMeetingParticipantsInvite: boolean;
  canUpdateMeetingParticipantsKick: boolean;
  canUpdateMeetingWidgets: boolean;
  canUpdateMeetingPermissions: boolean;
  canCloseMeeting: boolean;
};

export function makeSelectRoomPermissions(): (
  state: RootState,
  roomId: string,
  userId: string | undefined,
) => RoomPermissions {
  return createSelector(
    (_: RootState, __: string, userId: string | undefined) => userId,
    selectRoomPowerLevelsEventByRoomId,
    selectRoomCreateEventByRoomId,
    (userId, roomPowerLevelsEvent, roomCreateEvent) => {
      const canCreateMeeting = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [RoomEvents.NET_NORDECK_MEETINGS_MEETING_CREATE],
        },
      );

      const canCreateBreakoutSessions = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_BREAKOUTSESSIONS_CREATE,
          ],
        },
      );
      const canSendMessageToAllBreakoutSessions = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_SUB_MEETINGS_SEND_MESSAGE,
          ],
        },
      );

      const canUpdateMeetingDetails = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            'm.room.message',
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_UPDATE,
          ],
          stateEventTypes: [
            STATE_EVENT_ROOM_NAME,
            STATE_EVENT_ROOM_TOPIC,
            STATE_EVENT_NORDECK_MEETING_METADATA,
            STATE_EVENT_WIDGETS,
          ],
        },
      );

      const canUpdateMeetingParticipantsInvite = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_PARTICIPANTS_HANDLE,
          ],
          actions: ['invite'],
        },
      );

      const canUpdateMeetingParticipantsKick = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_PARTICIPANTS_HANDLE,
          ],
          actions: ['kick'],
        },
      );

      const canUpdateMeetingWidgets = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_WIDGETS_HANDLE,
          ],
          stateEventTypes: [STATE_EVENT_WIDGETS, 'io.element.widgets.layout'],
        },
      );

      const canUpdateMeetingPermissions = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [
            RoomEvents.NET_NORDECK_MEETINGS_MEETING_CHANGE_MESSAGE_PERMISSIONS,
          ],
          stateEventTypes: [STATE_EVENT_POWER_LEVELS],
        },
      );

      const canCloseMeeting = hasPermissions(
        roomPowerLevelsEvent,
        roomCreateEvent,
        userId,
        {
          roomEventTypes: [RoomEvents.NET_NORDECK_MEETINGS_MEETING_CLOSE],
          stateEventTypes: [STATE_EVENT_WIDGETS, STATE_EVENT_ROOM_TOMBSTONE],
        },
      );

      return {
        canCreateMeeting,
        canCreateBreakoutSessions,
        canSendMessageToAllBreakoutSessions,
        canUpdateMeetingDetails,
        canUpdateMeetingParticipantsInvite,
        canUpdateMeetingParticipantsKick,
        canUpdateMeetingWidgets,
        canUpdateMeetingPermissions,
        canCloseMeeting,
      };
    },
  );
}
