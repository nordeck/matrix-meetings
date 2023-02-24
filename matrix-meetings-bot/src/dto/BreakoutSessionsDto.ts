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

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DoesWidgetWithIdExist } from '../validator/DoesWidgetWithIdExist';
import { BreakoutSessionsDetailDto } from './BreakoutSessionsDetailDto';

export class BreakoutSessionsDto {
  /**
   * Breakout session groups
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakoutSessionsDetailDto)
  groups: BreakoutSessionsDetailDto[] = [];

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
  start_time: string;

  /**
   * end time in ISO 8601
   * @example 2021-06-28T23:07:21.488Z
   */
  @IsISO8601()
  end_time: string;

  /**
   * state_keys of widgets configured in default_events.json
   * @example ["jitsi"]
   */
  @IsArray()
  @DoesWidgetWithIdExist({ each: true })
  @IsOptional()
  @IsString({ each: true })
  widget_ids?: string[];

  /**
   * enables meeting auto deletion
   */
  @IsBoolean()
  @IsOptional()
  enable_auto_deletion?: boolean;

  constructor(
    groups: BreakoutSessionsDetailDto[],
    description: string,
    start_time: string,
    end_time: string,
    widget_ids: string[],
    enable_auto_deletion: boolean | undefined
  ) {
    this.groups = groups;
    this.description = description;
    this.start_time = start_time;
    this.end_time = end_time;
    this.widget_ids = widget_ids;
    this.enable_auto_deletion = enable_auto_deletion;
  }
}
