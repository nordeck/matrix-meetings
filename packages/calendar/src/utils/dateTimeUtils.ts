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
import { DateTimeEntry } from '../model';
import { toISOSafe } from './helpers';

export function parseICalDate(dateTimeEntry: DateTimeEntry): DateTime {
  return DateTime.fromFormat(dateTimeEntry.value, "yyyyMMdd'T'HHmmss", {
    zone: dateTimeEntry.tzid,
  });
}

export function formatICalDate(
  date: Date | DateTime,
  targetTzId: string = 'UTC',
): DateTimeEntry {
  const dateTime = DateTime.isDateTime(date) ? date : DateTime.fromJSDate(date);
  return {
    value: dateTime.setZone(targetTzId).toFormat("yyyyMMdd'T'HHmmss"),
    tzid: targetTzId,
  };
}

/** Format the date into an ISO string that will always be in UTC time (yyyy-MM-ddTHH:mm:ssZ) */
export function toISOString(date: Date | DateTime): string {
  const jsDate = DateTime.isDateTime(date) ? date : DateTime.fromJSDate(date);
  return toISOSafe(jsDate.toUTC(), { suppressMilliseconds: true });
}
