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
import { parseICalDate, toISOString } from '../dateTimeUtils';
import { generateRruleSet } from './generateRruleSet';
import {
  createTimeFilter,
  isRRuleEntry,
  isRRuleOverrideEntry,
  isSingleEntry,
} from './helpers';

/**
 * A list of calendar entries that were used to create this event. It will always
 * contain at least one entry.
 *
 * If the meeting is not recurring, this will include a single entry.
 *
 * If the meeting is recurring, this will include at least one and at max two
 * entries. The first entry will be the series entry. It is the first occurrence
 * of the series with the rrule. If the meeting deviates from the series, the
 * second entry is the overriding series with the recurrence-id.
 */
export type CalendarSourceEntries = CalendarEntry[];

export type CalendarEvent = {
  /** The uid of the entry. */
  uid: string;

  /** The inclusive start date and time as ISO string. */
  startTime: string;

  /** The exclusive end date and time as ISO string. */
  endTime: string;

  /**
   * The calendar entries that were used for this event.
   *
   * If multiple entries are present, this entry is a recurrence event that
   * diverges from the original series. The first entry will then always
   * contain the series while the last one the override.
   */
  entries: CalendarSourceEntries;

  /**
   * The ID of this entry in the recurrence rule.
   *
   * @remarks Only defined if this entry is part of a recurring event.
   */
  recurrenceId?: string;
};

type CalculateCalendarEventsProps = {
  /** The calendar property of a calendar room */
  calendar: CalendarEntry[];

  /**
   * The inclusive start date of the events. This is inclusive. It will also
   * include running events that started in the past.
   */
  fromDate: string;

  /**
   * The inclusive end date of the events.
   * Can be skipped if {@code limit} is provided.
   */
  toDate?: string;

  /**
   * Defined how many upcoming events are returned.
   * Can be skipped if {@code toDate} is provided.
   */
  limit?: number;
} & (
  | { toDate?: undefined; limit: number }
  | { toDate: string; limit?: number }
);

/**
 * Generate a list of all recurrence entries in a `calendar`.
 *
 * @param param0 - {@link CalculateCalendarEventsProps}
 * @returns a list of events that happen in the room
 */
export function calculateCalendarEvents({
  calendar,
  fromDate,
  toDate,
  limit,
}: CalculateCalendarEventsProps): CalendarEvent[] {
  const filterEvent = createTimeFilter(fromDate, toDate);

  const events: CalendarEvent[] = [];

  for (const entry of calendar.filter(isSingleEntry)) {
    const event: CalendarEvent = {
      uid: entry.uid,
      startTime: toISOString(parseICalDate(entry.dtstart)),
      endTime: toISOString(parseICalDate(entry.dtend)),
      entries: [entry],
    };

    if (filterEvent(event)) {
      events.push(event);
    }
  }

  for (const entry of calendar.filter(isRRuleEntry)) {
    const rruleOverrideEntries = calendar
      .filter(isRRuleOverrideEntry)
      .filter((o) => o.uid === entry.uid);

    const recurrenceEvents: Record<string, CalendarEvent> = {};

    const { rruleSet, fromRruleSetDate, toRruleSetDate } =
      generateRruleSet(entry);

    const entryDuration = parseICalDate(entry.dtend).diff(
      parseICalDate(entry.dtstart)
    );
    const filterStartDate = toRruleSetDate(
      DateTime.fromISO(fromDate)
        // we want to filter inclusively so we need to move
        // the filter back by one duration
        .minus(entryDuration)
    );
    let recurrenceIdsRaw: Date[];

    if (toDate) {
      const filterEndDate = toRruleSetDate(DateTime.fromISO(toDate));

      recurrenceIdsRaw = rruleSet.between(filterStartDate, filterEndDate, true);
    } else if (limit !== undefined) {
      recurrenceIdsRaw = [];

      let date = rruleSet.after(filterStartDate, true);
      if (date) {
        recurrenceIdsRaw.push(date);

        // overrides could potentially move entries out of the limit.
        // to be safe, we generate more events.
        for (let i = 1; i < limit + rruleOverrideEntries.length; i++) {
          date = rruleSet.after(date);

          if (!date) {
            break;
          }

          recurrenceIdsRaw.push(date);
        }
      }
    } else {
      throw new Error('Either limit or toDate must be defined');
    }

    // create the original recurrence entries
    recurrenceIdsRaw.map(fromRruleSetDate).forEach((recurrenceId) => {
      recurrenceEvents[toISOString(recurrenceId)] = {
        uid: entry.uid,
        startTime: toISOString(recurrenceId),
        endTime: toISOString(recurrenceId.plus(entryDuration)),
        entries: [entry],
        recurrenceId: toISOString(recurrenceId),
      };
    });

    // create the override recurrence entries
    rruleOverrideEntries.forEach((o) => {
      const recurrenceId = parseICalDate(o.recurrenceId);

      // skip if not part of the series
      const recurrenceDate = toRruleSetDate(recurrenceId);
      const recurrenceEntry = rruleSet.after(recurrenceDate, true);

      if (
        recurrenceEntry &&
        recurrenceDate.getTime() === recurrenceEntry.getTime()
      ) {
        recurrenceEvents[toISOString(recurrenceId)] = {
          uid: o.uid,
          startTime: toISOString(parseICalDate(o.dtstart)),
          endTime: toISOString(parseICalDate(o.dtend)),
          entries: [entry, o],
          recurrenceId: toISOString(recurrenceId),
        };
      }
    });

    // add all events
    events.push(...Object.values(recurrenceEvents).filter(filterEvent));
  }

  events.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return events.slice(0, limit);
}
