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

import { RoomEventsBuilder } from './RoomEventsBuilder';

export function create_test_meeting(
  creator: string,
  room_id: string,
  parent_room_id: string | null,
  widgetTypes: string[] = ['jitsi', 'etherpad', 'whiteboard'],
  isMeeting = true
) {
  const builder = new RoomEventsBuilder(
    creator,
    room_id,
    parent_room_id,
    isMeeting
  );
  for (const widgetType of widgetTypes) {
    builder.withWidgetType(widgetType);
  }
  return builder.build();
}
