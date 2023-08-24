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

import { Info } from 'luxon';
import { StringUnitLength } from 'luxon/src/misc';
import { getWeekdayShift } from './getWeekdayShift';

export function localeWeekdays(
  length?: StringUnitLength,
  format?: boolean,
): string[] {
  const day = getWeekdayShift();

  const weekdays = format ? Info.weekdaysFormat(length) : Info.weekdays(length);
  for (let i = 0; i < Math.abs(day); i++) {
    if (day > 0) {
      weekdays.unshift(weekdays.pop()!);
    } else {
      weekdays.push(weekdays.shift()!);
    }
  }

  return weekdays;
}
