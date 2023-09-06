/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { DateTime } from 'luxon';
import { CalendarEntry } from '../../matrix';
import { formatICalDate } from '../dateTimeUtils';

/**
 * A list of updated calendar entries
 * add new override entry or update existing one
 */
export function overrideCalendarEntries(
  recurrenceId: string,
  startDate: string,
  endDate: string,
  calendarEntries: CalendarEntry[],
): CalendarEntry[] {
  const tzid = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hasOldRecurrenceId = calendarEntries.some(
    (entry) =>
      entry.recurrenceId &&
      entry.recurrenceId.value ===
        formatICalDate(new Date(recurrenceId), tzid).value,
  );
  const updatedCalendarEntry = calendarEntries.map((entry) => {
    if (
      entry.recurrenceId &&
      entry.recurrenceId.value ===
        formatICalDate(new Date(recurrenceId), tzid).value
    ) {
      return {
        ...entry,
        dtstart: formatICalDate(DateTime.fromISO(startDate), tzid),
        dtend: formatICalDate(DateTime.fromISO(endDate), tzid),
      };
    }
    return entry;
  });

  const overrideCalendar: CalendarEntry = {
    uid: calendarEntries[0].uid,
    dtstart: formatICalDate(DateTime.fromISO(startDate), tzid),
    dtend: formatICalDate(DateTime.fromISO(endDate), tzid),
    recurrenceId: formatICalDate(new Date(recurrenceId), tzid),
  };
  const addCalendarEntry = [...calendarEntries, overrideCalendar];

  return hasOldRecurrenceId ? updatedCalendarEntry : addCalendarEntry;
}
