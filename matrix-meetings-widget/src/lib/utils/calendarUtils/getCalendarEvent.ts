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
import { CalendarEntry } from '../../matrix';
import { parseICalDate } from '../dateTimeUtils';
import {
  calculateCalendarEvents,
  CalendarEvent,
} from './calculateCalendarEvents';
import { getCalendarEnd } from './getCalendarEnd';
import { isRRuleOverrideEntry } from './helpers';

/**
 * Get the best fitting entry from a calendar.
 *
 * If the room hosts a recurring series or multiple single events, the
 * active/next/last occurrence (in that order) is returned.
 *
 * @param calendar - the calendar property of a calendar room
 * @returns the event in the room, or undefined
 */
export function getCalendarEvent(
  calendar: CalendarEntry[],
): CalendarEvent | undefined;

/**
 * Get the entry from a calendar, based on a selection of inputs.
 *
 * @param calendar - the calendar property of a calendar room
 * @param uid - the uid of the entry.
 * @param recurrenceId - the recurrenceId of the entry.
 * @returns the event that is specified with the parameters, or undefined
 */
export function getCalendarEvent(
  calendar: CalendarEntry[],
  uid: string,
  recurrenceId: string | undefined,
): CalendarEvent | undefined;

/**
 * Get the entry from a calendar, based on a selection of inputs.
 *
 * @param calendar - the calendar property of a calendar room
 * @param uid - the uid of the entry. If undefined, the active/next entry is
 *              returned.
 * @param recurrenceId - the recurrenceId of the entry. If undefined, the
 *                       active/next entry is returned.
 * @returns the event that is specified with the parameters, or undefined
 */
export function getCalendarEvent(
  calendar: CalendarEntry[],
  uid?: string,
  recurrenceId?: string,
): CalendarEvent | undefined {
  const relatedCalendar =
    uid === undefined ? calendar : calendar.filter((c) => c.uid === uid);
  let entry: CalendarEvent | undefined = undefined;

  if (recurrenceId) {
    const overrideEntry = calendar
      .filter(isRRuleOverrideEntry)
      .find(
        (c) =>
          c.uid === uid &&
          +parseICalDate(c.recurrenceId) === +DateTime.fromISO(recurrenceId),
      );

    // find a recurrence entry by recurrence id
    const entries = calculateCalendarEvents({
      calendar: relatedCalendar,
      // only consider events that match the override
      // entry OR include the recurrenceId
      fromDate: overrideEntry
        ? parseICalDate(overrideEntry.dtstart).toISO()
        : recurrenceId,
      toDate: overrideEntry
        ? parseICalDate(overrideEntry.dtend).toISO()
        : recurrenceId,
    });

    // We might find multiple overlapping meetings and
    // must select the correct entry.
    return entries.find((entry) => entry.recurrenceId === recurrenceId);
  }

  // find the next entry from now (or current, or first)
  [entry] = calculateCalendarEvents({
    calendar: relatedCalendar,
    fromDate: DateTime.now().toISO(),
    limit: 1,
  });

  if (!entry) {
    // find the last entry after the series ended
    const calendarEnd = getCalendarEnd(relatedCalendar);

    if (calendarEnd && calendarEnd < DateTime.now()) {
      [entry] = calculateCalendarEvents({
        calendar: relatedCalendar,
        // meeting end is exclusive, therefore we need to adjust our search
        // space a bit
        fromDate: calendarEnd.minus({ milliseconds: 1 }).toISO(),
        limit: 1,
      });
    }
  }

  return entry;
}
