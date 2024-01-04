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
  parseICalDate,
} from '@nordeck/matrix-meetings-calendar';
import { isRRuleOverrideEntry } from './helpers';

/**
 * A list of updated calendar entries
 * add new override entry or update existing one
 */
export function overrideCalendarEntries(
  calendarEntries: CalendarEntry[],
  newCalendarEntry: CalendarEntry,
): CalendarEntry[] {
  if (isRRuleOverrideEntry(newCalendarEntry)) {
    return calendarEntries
      .filter(
        (c) =>
          !(
            c.recurrenceId &&
            newCalendarEntry.recurrenceId &&
            c.uid === newCalendarEntry.uid &&
            +parseICalDate(c.recurrenceId) ===
              +parseICalDate(newCalendarEntry.recurrenceId)
          ),
      )
      .concat(newCalendarEntry);
  }

  return (
    calendarEntries
      // Remove all existing entries for this single or recurring event
      // TODO (PB-2988): try to keep all overrides that are still part of the new series
      .filter((c) => c.uid !== newCalendarEntry.uid)
      .concat(newCalendarEntry)
  );
}
