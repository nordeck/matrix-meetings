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
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

/**
 * A timezoned date-time entry
 */
export class DateTimeEntryDto {
  /**
   * The timezone in which the value should be interpreted in.
   * Example: Europe/Berlin
   * Corresponds to the TZNAME type.
   */
  @IsString()
  tzid: string;

  /**
   * The date and time of this entry.
   * It uses a iCalendar-specific timezone-less format.
   * Example: 20220101T100000
   * Corresponds to the DATE-TIME type.
   */
  @IsString()
  @Matches(/^[\d]{8}T[\d]{6}$/)
  value: string;

  constructor(tzid: string, value: string) {
    this.tzid = tzid;
    this.value = value;
  }
}

export class CalendarEntryDto {
  /**
   * The uid of the entry.
   * Corresponds to the UID field
   */
  @IsString()
  uid: string;

  /**
   * The start date and time of the entry.
   * Corresponds to the DTSTART field.
   */
  @IsObject()
  @ValidateNested()
  dtstart: DateTimeEntryDto;

  /**
   * The end date and time of the entry.
   * Corresponds to the DTEND field.
   */
  @IsObject()
  @ValidateNested()
  dtend: DateTimeEntryDto;

  /**
   * The recurring rule of the entry in the original iCal format.
   * Corresponds to the RRULE field.
   */
  @IsString()
  @IsOptional()
  rrule?: string;

  /**
   * A list of excluded dates.
   * Each date should match a recurrence entry of the series when
   * normalized to UTC (example: Europe/Berlin:20220101T100000
   * describes the same entry as Europe/London:20220101T090000).
   * Corresponds to the EXDATE field.
   */
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => DateTimeEntryDto)
  @IsOptional()
  exdate?: DateTimeEntryDto[];

  /**
   * The id of the recurrence entry that should be replaced with this entry.
   * This will replace a single occurrence for another entry in the array that:
   *   1. Has the same UID and SEQUENCE.
   *   2. Has a RRULE.
   * The recurrence ID should match a recurrence entry of the series when
   * normalized to UTC (example: Europe/Berlin:20220101T100000
   * describes the same entry as Europe/London:20220101T090000).
   * Corresponds to the RECURRENCE-ID field.
   */
  @IsObject()
  @ValidateNested()
  @IsOptional()
  recurrenceId?: DateTimeEntryDto;

  constructor(
    uid: string,
    dtstart: DateTimeEntryDto,
    dtend: DateTimeEntryDto,
    rrule?: string,
    exdate?: DateTimeEntryDto[],
    recurrenceId?: DateTimeEntryDto,
  ) {
    this.uid = uid;
    this.dtstart = dtstart;
    this.dtend = dtend;
    this.rrule = rrule;
    this.exdate = exdate;
    this.recurrenceId = recurrenceId;
  }
}
