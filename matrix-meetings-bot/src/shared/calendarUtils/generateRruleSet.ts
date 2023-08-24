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
import { RRule, RRuleSet } from 'rrule';
import { CalendarEntryDto } from '../../dto/CalendarEntryDto';
import { parseICalDate } from '../dateTimeUtils';
import { isFiniteSeries } from './helpers';

export function generateRruleSet(entry: CalendarEntryDto & { rrule: string }): {
  rruleSet: RRuleSet;
  toRruleSetDate: (input: DateTime) => Date;
  fromRruleSetDate: (input: Date) => DateTime;
  isFinite: boolean;
} {
  // rrule needs dates that look like they are in UTC
  // but they are actually in the time zone of dtstart
  function toRruleSetDate(input: DateTime): Date {
    return (
      input
        // move it into the zone of dtstart because rrule
        // expects times in that timezone
        .setZone(entry.dtstart.tzid)
        // remove the zone
        .setZone('UTC', { keepLocalTime: true })
        .toJSDate()
    );
  }

  // rrule generates dates that look like they are in UTC
  // but they are actually in the time zone of dtstart
  function fromRruleSetDate(input: Date): DateTime {
    return DateTime.fromJSDate(input)
      .toUTC()
      .setZone(entry.dtstart.tzid, { keepLocalTime: true });
  }

  const rruleSet = new RRuleSet();

  const rruleOptions = RRule.parseString(entry.rrule);

  rruleSet.rrule(
    new RRule({
      ...rruleOptions,
      dtstart: toRruleSetDate(parseICalDate(entry.dtstart)),
    }),
  );

  entry.exdate?.forEach((exdate) => {
    rruleSet.exdate(toRruleSetDate(parseICalDate(exdate)));
  });

  return {
    rruleSet,
    fromRruleSetDate,
    toRruleSetDate,
    isFinite: isFiniteSeries(rruleOptions),
  };
}
