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

export type { CalendarEntry, DateTimeEntry } from './calendarEntry';
export {
  isValidNordeckMeetingMetadataEvent,
  migrateNordeckMeetingMetadataEventSchema,
  STATE_EVENT_NORDECK_MEETING_METADATA,
} from './nordeckMeetingMetadataEvent';
export type { NordeckMeetingMetadataEvent } from './nordeckMeetingMetadataEvent';
export { isValidReactionEvent, ROOM_EVENT_REACTION } from './reactionEvent';
export type { ReactionEvent } from './reactionEvent';
export {
  isValidRoomCreateEvent,
  STATE_EVENT_ROOM_CREATE,
} from './roomCreateEvent';
export type { RoomCreateEvent } from './roomCreateEvent';
export { isValidRoomNameEvent, STATE_EVENT_ROOM_NAME } from './roomNameEvent';
export type { RoomNameEvent } from './roomNameEvent';
export {
  isValidRoomTombstoneEvent,
  STATE_EVENT_ROOM_TOMBSTONE,
} from './roomTombstoneEvent';
export type { RoomTombstoneEvent } from './roomTombstoneEvent';
export {
  isValidRoomTopicEvent,
  STATE_EVENT_ROOM_TOPIC,
} from './roomTopicEvent';
export type { RoomTopicEvent } from './roomTopicEvent';
export {
  isValidSpaceChildEvent,
  STATE_EVENT_SPACE_CHILD,
} from './spaceChildEvent';
export type { SpaceChildEvent } from './spaceChildEvent';
export {
  isValidSpaceParentEvent,
  STATE_EVENT_SPACE_PARENT,
} from './spaceParentEvent';
export type { SpaceParentEvent } from './spaceParentEvent';
export { isValidWidgetsEvent, STATE_EVENT_WIDGETS } from './widgetsEvent';
export type { WidgetsEvent } from './widgetsEvent';
