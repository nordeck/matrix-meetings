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

import Joi from 'joi';

/**
 * A timezoned date-time entry
 */
export type DateTimeEntry = {
  /**
   * The timezone in which the value should be interpreted in.
   * Example: Europe/Berlin
   * Corresponds to the TZNAME type.
   */
  tzid: string;

  /**
   * The date and time of this entry.
   * It uses a iCalendar-specific timezone-less format.
   * Example: 20220101T100000
   * Corresponds to the DATE-TIME type.
   */
  value: string;
};

export const dateTimeEntrySchema = Joi.object<DateTimeEntry, true>({
  tzid: Joi.string().required(),
  value: Joi.string()
    .pattern(/^[\d]{8}T[\d]{6}$/)
    .required(),
}).unknown();

export type CalendarEntry = {
  /**
   * The uid of the entry.
   * Corresponds to the UID field
   */
  uid: string;

  /**
   * The inclusive start date and time of the entry.
   * Corresponds to the DTSTART field.
   */
  dtstart: DateTimeEntry;

  /**
   * The non-inclusive end date and time of the entry.
   * Corresponds to the DTEND field.
   */
  dtend: DateTimeEntry;

  /**
   * The recurring rule of the entry in the original iCal format.
   * Corresponds to the RRULE field.
   */
  rrule?: string;

  /**
   * A list of excluded dates.
   * Each date should match a recurrence entry of the series when
   * normalized to UTC (example: Europe/Berlin:20220101T100000
   * describes the same entry as Europe/London:20220101T090000).
   * Corresponds to the EXDATE field.
   */
  exdate?: DateTimeEntry[];

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
  recurrenceId?: DateTimeEntry;
};

export const calendarEntrySchema = Joi.object<CalendarEntry, true>({
  uid: Joi.string().required(),
  dtstart: dateTimeEntrySchema.required(),
  dtend: dateTimeEntrySchema.required(),
  rrule: Joi.string(),
  exdate: Joi.array().items(dateTimeEntrySchema),
  recurrenceId: dateTimeEntrySchema,
}).unknown();
