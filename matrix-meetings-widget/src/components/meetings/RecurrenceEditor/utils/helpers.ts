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

import { ByWeekday, RRule, Weekday } from 'rrule';

export function convertWeekdayFromLocaleToRRule(index: number): number {
  return (index - 1 + 7) % 7;
}

export function normalizeNumeric(
  bymonth: number | number[] | null | undefined
): number | undefined {
  if (bymonth === null || bymonth === undefined) {
    return undefined;
  }

  if (Array.isArray(bymonth)) {
    // Only take the first value and discard the rest
    // TODO: This can actually be a problem as we don't support all possible
    // ways data can be modeled.
    return bymonth[0];
  }

  return bymonth;
}

export function normalizeByWeekday(
  byweekday: ByWeekday | ByWeekday[] | null | undefined
): number[] | undefined {
  if (byweekday === null || byweekday === undefined) {
    return undefined;
  }

  if (Array.isArray(byweekday)) {
    return byweekday.map(normalizeWeekday);
  }

  return [normalizeWeekday(byweekday)];
}

export function normalizeWeekday(weekday: ByWeekday): number {
  if (typeof weekday === 'string') {
    return Weekday.fromStr(weekday).weekday;
  } else if (typeof weekday === 'number') {
    return weekday;
  } else {
    return weekday.weekday;
  }
}

export function isWeekdays(byweekday: number[] | undefined): boolean {
  if (byweekday === undefined) {
    return false;
  }

  return (
    // Check for MO-FR
    byweekday.includes(RRule.MO.weekday) &&
    byweekday.includes(RRule.TU.weekday) &&
    byweekday.includes(RRule.WE.weekday) &&
    byweekday.includes(RRule.TH.weekday) &&
    byweekday.includes(RRule.FR.weekday) &&
    // but not SA-SU
    !byweekday.includes(RRule.SA.weekday) &&
    !byweekday.includes(RRule.SU.weekday)
  );
}
