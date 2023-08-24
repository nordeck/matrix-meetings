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

import { CalendarEntryDto } from '../dto/CalendarEntryDto';
import { getCalendarEnd } from './calendarUtils/getCalendarEnd';
import { parseICalDate, toISOString } from './dateTimeUtils';

/**
 * Extract the start time of the first entry of the {@code calendar} param if present.
 *
 * @remarks This is only a temporary solution until we properly
 *          support recurrence rules.
 *
 * @param start_time - the start_time field of the meeting metadata
 * @param calendar - the calendar field of the meeting metadata
 * @returns the start time
 * @throws if both start_time and calendar are undefined
 */
export function getMeetingStartTime(
  start_time: string | undefined,
  calendar: CalendarEntryDto[] | undefined,
): string {
  if (calendar && calendar.length > 0) {
    return toISOString(parseICalDate(calendar[0].dtstart));
  }

  if (start_time === undefined) {
    throw new Error(
      'Unexpected input: Both start_time and calendar are undefined',
    );
  }

  return start_time;
}

/**
 * Extract the end time of the first entry of the {@code calendar} param if present.
 *
 * @remarks This is only a temporary solution until we properly
 *          support recurrence rules.
 *
 * @param end_time - the end_time field of the meeting metadata
 * @param calendar - the calendar field of the meeting metadata
 * @returns the end time
 * @throws if both end_time and calendar are undefined
 */
export function getMeetingEndTime(
  end_time: string | undefined,
  calendar: CalendarEntryDto[] | undefined,
): string {
  if (calendar && calendar.length > 0) {
    return toISOString(parseICalDate(calendar[0].dtend));
  }

  if (end_time === undefined) {
    throw new Error(
      'Unexpected input: Both end_time and calendar are undefined',
    );
  }

  return end_time;
}

/**
 * Calculate the force_deletion_time as an offset after the last occurrence defined by {@code calendar}.
 *
 * @param auto_deletion_offset - the offset after the last occurrence in minutes.
 * @param calendar - the calendar field of the meeting metadata
 * @returns the time to delete the meeting room as unix timestamp in milliseconds.
 */
export function getForceDeletionTime(
  auto_deletion_offset: number | undefined,
  calendar: CalendarEntryDto[] | undefined,
): number | undefined {
  if (auto_deletion_offset !== undefined && calendar && calendar.length > 0) {
    const calendarEnd = getCalendarEnd(calendar);

    return calendarEnd
      ? calendarEnd
          .plus({ minutes: Math.max(0, auto_deletion_offset) })
          .toMillis()
      : undefined;
  }

  return undefined;
}
