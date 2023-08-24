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

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ExternalData } from '../model/ExternalData';
import { DoesWidgetWithIdExist } from '../validator/DoesWidgetWithIdExist';
import { IsIncompatibleWithSibling } from '../validator/IsIncompatibleWithSibling';
import { IsMatrixRoomId } from '../validator/IsMatrixRoomId';
import { CalendarEntryDto } from './CalendarEntryDto';
import { ParticipantDto } from './ParticipantDto';

export class MeetingCreateDto {
  /**
   * parent meeting room id
   */
  @IsString()
  @IsMatrixRoomId()
  @IsOptional()
  parent_room_id?: string;

  /**
   * title
   */
  @IsString()
  title: string;

  /**
   * description
   */
  @IsString()
  description: string;

  /**
   * start time in ISO 8601
   * @example 2021-06-28T22:07:21.488Z
   */
  @IsISO8601()
  @IsIncompatibleWithSibling('calendar')
  @ApiProperty({ required: true })
  start_time?: string;

  /**
   * end time in ISO 8601
   * @example 2021-06-28T23:07:21.488Z
   */
  @IsISO8601()
  @IsIncompatibleWithSibling('calendar')
  @ApiProperty({ required: true })
  end_time?: string;

  /**
   * a list of calendar entries that happen in this room
   */
  @IsArray()
  @ValidateNested({ each: true })
  @IsObject({ each: true })
  @Type(() => CalendarEntryDto)
  @IsIncompatibleWithSibling('start_time', 'end_time')
  @ApiHideProperty()
  calendar?: CalendarEntryDto[];

  /**
   * state_keys of widgets configured in default_events.json
   * @example ["jitsi"]
   */
  @IsArray()
  @DoesWidgetWithIdExist({ each: true })
  @IsOptional()
  widget_ids?: string[];

  /**
   * participants
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  @IsObject({ each: true })
  @IsOptional()
  participants?: ParticipantDto[];

  /**
   * power level required to send events in the room
   */
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @IsOptional()
  messaging_power_level?: number;

  /**
   * enables meeting auto deletion
   */
  @IsBoolean()
  @IsOptional()
  enable_auto_deletion?: boolean = true;

  /**
   * custom external data
   */
  @IsObject()
  @IsOptional()
  external_data?: ExternalData;

  constructor(
    parent_room_id: string | undefined,
    title: string,
    description: string,
    startTime: string | undefined,
    endTime: string | undefined,
    calendar: CalendarEntryDto[] | undefined,
    widgetIds: string[] | undefined,
    participants: ParticipantDto[] | undefined,
    messagingPowerLevel: number | undefined,
    enableAutoDeletion: boolean | undefined,
    externalData: ExternalData | undefined,
  ) {
    this.parent_room_id = parent_room_id;
    this.title = title;
    this.description = description;
    this.start_time = startTime;
    this.end_time = endTime;
    this.calendar = calendar;
    this.widget_ids = widgetIds;
    this.participants = participants;
    this.messaging_power_level = messagingPowerLevel;
    this.enable_auto_deletion = enableAutoDeletion;
    this.external_data = externalData;
  }
}
