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

import { IsString } from 'class-validator';
import { IsMatrixRoomId } from '../validator/IsMatrixRoomId';

export class SubMeetingsSendMessageDto {
  /**
   * target room id
   */
  @IsString()
  @IsMatrixRoomId()
  target_room_id: string;

  /**
   * Message text (no HTML tags)
   */
  @IsString()
  message: string;

  constructor(target_room_id: string, message: string) {
    this.target_room_id = target_room_id;
    this.message = message;
  }
}
