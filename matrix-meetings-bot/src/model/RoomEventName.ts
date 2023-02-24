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

export enum RoomEventName {
  M_ROOM_MESSAGE = 'm.room.message',
  M_ROOM_NOTICE = 'm.notice',
  M_TEXT = 'm.text',
  M_EMOTE = 'm.emote',

  NIC_MEETINGS_MEETING_CREATE = 'net.nordeck.meetings.meeting.create',
  NIC_MEETINGS_BREAKOUTSESSIONS_CREATE = 'net.nordeck.meetings.breakoutsessions.create',
  NIC_MEETINGS_MEETING_UPDATE_DETAILS = 'net.nordeck.meetings.meeting.update',
  NIC_MEETING_MEETING_CHANGE_MESSAGING_PERMISSIONS = 'net.nordeck.meetings.meeting.change.message_permissions',
  NIC_MEETINGS_MEETING_CLOSE = 'net.nordeck.meetings.meeting.close',
  NIC_MEETINGS_SUB_MEETINGS_SEND_MESSAGE = 'net.nordeck.meetings.sub_meetings.send_message',
  NIC_MEETINGS_MEETING_PARTICIPANTS_HANDLE = 'net.nordeck.meetings.meeting.participants.handle',
  NIC_MEETINGS_MEETING_WIDGETS_HANDLE = 'net.nordeck.meetings.meeting.widgets.handle',
}
