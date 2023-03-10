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

import { Options } from 'rrule';
import { CalendarEntryDto, DateTimeEntryDto } from '../../dto/CalendarEntryDto';

export function isSingleEntry(
  entry: CalendarEntryDto
): entry is Omit<CalendarEntryDto, 'rrule' | 'recurrenceId' | 'exdate'> {
  return entry.rrule === undefined && entry.recurrenceId === undefined;
}

export function isRRuleEntry(
  entry: CalendarEntryDto
): entry is CalendarEntryDto & { rrule: string } {
  return entry.rrule !== undefined && entry.recurrenceId === undefined;
}

export function isRRuleOverrideEntry(
  entry: CalendarEntryDto
): entry is CalendarEntryDto & {
  recurrenceId: DateTimeEntryDto;
} {
  return entry.recurrenceId !== undefined;
}

export function isFiniteSeries(rruleOptions: Partial<Options>): boolean {
  return rruleOptions.count !== undefined || rruleOptions.until !== undefined;
}
