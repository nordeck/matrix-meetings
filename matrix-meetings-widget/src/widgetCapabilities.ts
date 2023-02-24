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
  generateRoomTimelineCapabilities,
  STATE_EVENT_POWER_LEVELS,
  STATE_EVENT_ROOM_MEMBER,
  WIDGET_CAPABILITY_NAVIGATE,
} from '@matrix-widget-toolkit/api';
import {
  EventDirection,
  Symbols,
  WidgetEventCapability,
} from 'matrix-widget-api';
import {
  ROOM_EVENT_REACTION,
  STATE_EVENT_NORDECK_MEETING_METADATA,
  STATE_EVENT_ROOM_CREATE,
  STATE_EVENT_ROOM_NAME,
  STATE_EVENT_ROOM_TOMBSTONE,
  STATE_EVENT_ROOM_TOPIC,
  STATE_EVENT_SPACE_CHILD,
  STATE_EVENT_SPACE_PARENT,
  STATE_EVENT_WIDGETS,
} from './lib/matrix';
import { RoomEvents } from './reducer/meetingsApi';

export const widgetCapabilities = [
  WIDGET_CAPABILITY_NAVIGATE,
  ...generateRoomTimelineCapabilities(Symbols.AnyRoom),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_POWER_LEVELS
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Receive,
    ROOM_EVENT_REACTION
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_CREATE
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_TOMBSTONE
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_MEMBER
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_ROOM_MEMBER
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_NAME
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_TOPIC
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_SPACE_PARENT
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_SPACE_CHILD
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_NORDECK_MEETING_METADATA
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_WIDGETS
  ),

  // request the permission to send and receive all room events that the bot supports
  ...Object.values(RoomEvents)
    .map((type) => [
      WidgetEventCapability.forRoomEvent(EventDirection.Send, type),

      // we need the following capabilities because sendRoomEvents awaits the events
      WidgetEventCapability.forRoomEvent(EventDirection.Receive, type),
    ])
    .flat(),
];
