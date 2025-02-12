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

import { DateTime } from 'luxon';
import { CalendarEntry } from '../../model';
import { formatICalDate, parseICalDate } from '../dateTimeUtils';
import { calculateCalendarEvents } from './calculateCalendarEvents';
import { toISOSave } from './helpers';

export function normalizeCalendarEntry(
  calendarEntry: CalendarEntry,
): CalendarEntry {
  const events = calculateCalendarEvents({
    calendar: [calendarEntry],
    fromDate: toISOSave(parseICalDate(calendarEntry.dtstart)),
    limit: 1,
  });

  if (events.length === 0) {
    return calendarEntry;
  }

  const firstEvent = events[0];

  return {
    ...calendarEntry,
    dtstart: formatICalDate(
      DateTime.fromISO(firstEvent.startTime),
      calendarEntry.dtstart.tzid,
    ),
    dtend: formatICalDate(
      DateTime.fromISO(firstEvent.endTime),
      calendarEntry.dtend.tzid,
    ),
  };
}
