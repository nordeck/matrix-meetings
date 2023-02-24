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
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ExternalData } from '../model/ExternalData';
import { IsIncompatibleWithSibling } from '../validator/IsIncompatibleWithSibling';
import { IsMatrixRoomId } from '../validator/IsMatrixRoomId';
import { IsOptionalIfSiblingIsUndefined } from '../validator/IsOptionalIfSiblingIsUndefined';
import { CalendarEntryDto } from './CalendarEntryDto';

export class MeetingUpdateDetailsDto {
  /**
   * target room id
   */
  @IsString()
  @IsMatrixRoomId()
  target_room_id: string;

  /**
   * start time in ISO 8601
   * @example 2021-06-28T22:07:21.488Z
   */
  @IsISO8601()
  @IsOptionalIfSiblingIsUndefined('end_time')
  @IsIncompatibleWithSibling('calendar')
  @ApiProperty({ required: true })
  start_time?: string;

  /**
   * end time in ISO 8601
   * @example 2021-06-28T23:07:21.488Z
   */
  @IsISO8601()
  @IsOptionalIfSiblingIsUndefined('start_time')
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
  @IsOptional()
  @ApiHideProperty()
  calendar?: CalendarEntryDto[];

  /**
   * title
   */
  @IsString()
  @IsOptional()
  title?: string;

  /**
   * description
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * custom external data
   */
  @IsObject()
  @IsOptional()
  external_data?: ExternalData;

  constructor(
    target_room_id: string,
    start_time: string | undefined,
    end_time: string | undefined,
    calendar: CalendarEntryDto[] | undefined,
    title: string | undefined,
    description: string | undefined,
    externalData: ExternalData | undefined
  ) {
    this.target_room_id = target_room_id;
    this.start_time = start_time;
    this.end_time = end_time;
    this.calendar = calendar;
    this.title = title;
    this.description = description;
    this.external_data = externalData;
  }
}
