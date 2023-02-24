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

import { IsArray, IsBoolean, IsString } from 'class-validator';
import { DoesWidgetWithIdExist } from '../validator/DoesWidgetWithIdExist';
import { IsMatrixRoomId } from '../validator/IsMatrixRoomId';

export class MeetingWidgetsHandleDto {
  /**
   * Target room id
   */
  @IsString()
  @IsMatrixRoomId()
  target_room_id: string;

  /**
   * Perform add widget procedure
   */
  @IsBoolean()
  add: boolean;

  /**
   * state_keys of widgets configured in default_events.json
   * @example ["jitsi"]
   */
  @IsArray()
  @DoesWidgetWithIdExist({ each: true })
  @IsString({ each: true })
  widget_ids: string[];

  constructor(target_room_id: string, add: boolean, widget_ids: string[]) {
    this.target_room_id = target_room_id;
    this.add = add;
    this.widget_ids = widget_ids;
  }
}
