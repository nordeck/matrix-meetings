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

import {
  CalendarEntry,
  getCalendarEnd,
} from '@nordeck/matrix-meetings-calendar';
import { DateTime } from 'luxon';

/**
 * Calculate the force_deletion_time as an offset after the last occurrence defined by {@code calendar}.
 *
 * @param auto_deletion_offset - the offset after the last occurrence in minutes.
 * @param calendar - the calendar field of the meeting metadata
 * @returns the time to delete the meeting room as unix timestamp in milliseconds.
 */
export function getForceDeletionTime(
  auto_deletion_offset: number | undefined,
  calendar: CalendarEntry[] | undefined,
): number | undefined {
  if (auto_deletion_offset !== undefined && calendar && calendar.length > 0) {
    const calendarEnd = getCalendarEnd(calendar);

    return DateTime.isDateTime(calendarEnd)
      ? calendarEnd
          .plus({ minutes: Math.max(0, auto_deletion_offset) })
          .toMillis()
      : undefined;
  }

  return undefined;
}
