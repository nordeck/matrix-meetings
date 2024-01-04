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

import { CalendarEntry } from './matrix/model';

/**
 * Create a calendar entry with a single entry that starts at the given times.
 *
 * @param dtstart - the start time in the iCalendar format in UTC
 * @param dtend - the start time in the iCalendar format in UTC
 *
 * @remarks Only use for tests
 */
export function mockCalendar({
  uid = 'entry-0',
  dtstart,
  dtend,
  rrule,
  exdate,
  recurrenceId,
}: {
  uid?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
  exdate?: string[];
  recurrenceId?: string;
}): CalendarEntry[] {
  return [
    mockCalendarEntry({ uid, dtstart, dtend, rrule, exdate, recurrenceId }),
  ];
}

/**
 * Create a calendar entry that starts at the given times.
 *
 * @param dtstart - the start time in the iCalendar format in UTC
 * @param dtend - the start time in the iCalendar format in UTC
 *
 * @remarks Only use for tests
 */
export function mockCalendarEntry({
  uid = 'entry-0',
  dtstart,
  dtend,
  rrule,
  exdate,
  recurrenceId,
}: {
  uid?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
  exdate?: string[];
  recurrenceId?: string;
}): CalendarEntry {
  return {
    uid,
    dtstart: { tzid: 'UTC', value: dtstart },
    dtend: { tzid: 'UTC', value: dtend },
    rrule,
    exdate: exdate?.map((value) => ({ tzid: 'UTC', value })),
    recurrenceId:
      recurrenceId !== undefined
        ? { tzid: 'UTC', value: recurrenceId }
        : undefined,
  };
}
