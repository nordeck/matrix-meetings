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

import { base32 } from 'rfc4648';

export interface IEventContentParams {
  room_id?: string;
  base32_room_id?: string;
  title?: string;
  uuid?: string;
}

class EventContentParamsHelper {
  public newInstance(
    roomId: string | undefined,
    title: string | undefined,
  ): IEventContentParams {
    const base32RoomId = roomId
      ? base32.stringify(Buffer.from(roomId), { pad: false })
      : undefined;
    const base32AsUuid = roomId
      ? base32.stringify(Buffer.from(roomId), { pad: true }).slice(0, 25)
      : undefined;
    const nonNullTitle = title || '';

    return {
      room_id: roomId,
      base32_room_id: base32RoomId,
      title: nonNullTitle,
      uuid: base32AsUuid,
    };
  }
}

export const eventContentParams = new EventContentParamsHelper();
