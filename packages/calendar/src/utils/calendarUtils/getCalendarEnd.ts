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

import { max } from 'lodash';
import { DateTime } from 'luxon';
import { CalendarEntry } from '../../model';
import { parseICalDate } from '../dateTimeUtils';
import { generateRruleSet } from './generateRruleSet';
import { isRRuleEntry, isRRuleOverrideEntry, isSingleEntry } from './helpers';

/**
 * Calculate the last end date of the calendar.
 *
 * @param calendar - the calendar property of a calendar room
 * @returns the date of the last entry, `'infinite'` if the series never ends,
 *          or undefined if no end date could be calculated.
 */
export function getCalendarEnd(
  calendar: CalendarEntry[],
): DateTime | 'infinite' | undefined {
  let endDates = calendar
    .filter(isSingleEntry)
    .map((entry) => parseICalDate(entry.dtend));
  let isInfinite = false;

  calendar.filter(isRRuleEntry).forEach((entry) => {
    const { rruleSet, fromRruleSetDate, toRruleSetDate, isFinite } =
      generateRruleSet(entry);

    // an infinite series never ends
    if (!isFinite) {
      endDates = [];
      isInfinite = true;
      return;
    }

    const entryDuration = parseICalDate(entry.dtend).diff(
      parseICalDate(entry.dtstart),
    );

    const lastEntry = rruleSet.before(new Date(9999, 1, 1));

    if (!lastEntry) {
      return;
    }

    const latestSeriesEnd = fromRruleSetDate(lastEntry).plus(entryDuration);

    const latestOverride = max(
      calendar
        .filter(isRRuleOverrideEntry)
        .filter((o) => o.uid === entry.uid)
        .filter((o) => {
          const recurrenceId = parseICalDate(o.recurrenceId);

          // skip if not part of the series
          const recurrenceDate = toRruleSetDate(recurrenceId);
          const recurrenceEntry = rruleSet.after(recurrenceDate, true);
          return (
            recurrenceEntry &&
            recurrenceDate.getTime() === recurrenceEntry.getTime()
          );
        })
        .map((entry) => parseICalDate(entry.dtend)),
    );

    endDates.push(latestSeriesEnd);
    if (latestOverride) {
      endDates.push(latestOverride);
    }
  });

  if (isInfinite) {
    return 'infinite';
  }

  return max(endDates);
}
