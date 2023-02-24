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

import { RoomEventName } from './RoomEventName';
import { StateEventName } from './StateEventName';

class EventTypeHelper {
  /**
   * returns true/false if eventType is known to be a state event, undefined if unknown
   */
  isState(eventType: string): boolean | undefined {
    if (
      Object.values(StateEventName)
        .map((v) => v as string)
        .includes(eventType)
    ) {
      return true;
    } else if (
      Object.values(RoomEventName)
        .map((v) => v as string)
        .includes(eventType)
    ) {
      return false;
    } else {
      return undefined;
    }
  }
}

export const eventTypeHelper: EventTypeHelper = new EventTypeHelper();
