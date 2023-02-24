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
import { Frequency, Options } from 'rrule';

export function getDefaultRecurringMeetingEnd(
  frequency: Options['freq'] | undefined,
  dtstart: Date
): {
  defaultUntilDate: Date;
  defaultAfterMeetingCount: number;
} {
  switch (frequency) {
    case Frequency.DAILY:
      return {
        defaultUntilDate: DateTime.fromJSDate(dtstart)
          .plus({ days: 30 })
          .endOf('day')
          .toJSDate(),
        defaultAfterMeetingCount: 30,
      };
    case Frequency.WEEKLY:
      return {
        defaultUntilDate: DateTime.fromJSDate(dtstart)
          .plus({ weeks: 13 })
          .endOf('day')
          .toJSDate(),
        defaultAfterMeetingCount: 13,
      };
    case Frequency.MONTHLY:
      return {
        defaultUntilDate: DateTime.fromJSDate(dtstart)
          .plus({ months: 12 })
          .endOf('day')
          .toJSDate(),
        defaultAfterMeetingCount: 12,
      };
    case Frequency.YEARLY:
    default:
      return {
        defaultUntilDate: DateTime.fromJSDate(dtstart)
          .plus({ years: 5 })
          .endOf('day')
          .toJSDate(),
        defaultAfterMeetingCount: 5,
      };
  }
}

export function getDefaultCustomRuleProperties(startDate: Date): {
  defaultCustomMonth: number;
  defaultCustomNthMonthday: number;
  defaultCustomWeekday: number;
  defaultCustomNth: number;
} {
  const dateTime = DateTime.fromJSDate(startDate);
  const defaultCustomMonth = dateTime.month; // Starts at 1 in rrule
  const defaultCustomNthMonthday = dateTime.day;
  const defaultCustomWeekday = dateTime.weekday - 1; // Starts at 0 in rrule
  const defaultCustomNth = getWeekdayOrdinal(startDate);

  return {
    defaultCustomMonth,
    defaultCustomNthMonthday,
    defaultCustomWeekday,
    defaultCustomNth,
  };
}

function getWeekdayOrdinal(date: Date): number {
  const ordinal = Math.floor((DateTime.fromJSDate(date).day - 1) / 7) + 1;

  if (ordinal > 4) {
    // The 5th week of the month is considered as the last week of the month
    return -1;
  }

  return ordinal;
}
