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

import {
  CalendarEntry,
  formatICalDate,
  parseICalDate,
} from '@nordeck/matrix-meetings-calendar';
import { DateTime } from 'luxon';
import { getCalendarEvent } from './getCalendarEvent';
import { isRRuleEntry, isRRuleOverrideEntry } from './helpers';

export function deleteCalendarEvent(
  calendarEntries: CalendarEntry[],
  uid: string,
  recurrenceId: string,
): CalendarEntry[] {
  const event = getCalendarEvent(calendarEntries, uid, recurrenceId);

  if (event) {
    return calendarEntries
      .filter(
        (c) =>
          // Remove the override that matches this recurrence id
          !isRRuleOverrideEntry(c) ||
          c.uid !== uid ||
          +parseICalDate(c.recurrenceId) !== +DateTime.fromISO(recurrenceId),
      )
      .map((c) => {
        // Add the exdate to the matching series
        if (c.uid === uid && isRRuleEntry(c)) {
          return {
            ...c,
            exdate: (c.exdate ?? []).concat(
              formatICalDate(
                DateTime.fromISO(recurrenceId),
                new Intl.DateTimeFormat().resolvedOptions().timeZone,
              ),
            ),
          };
        }

        return c;
      });
  }

  return calendarEntries;
}
