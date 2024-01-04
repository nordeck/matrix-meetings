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

import {
  formatICalDate,
  parseICalDate,
} from '@nordeck/matrix-meetings-calendar';
import { differenceWith, isEqual } from 'lodash';
import { CalendarEntryDto, DateTimeEntryDto } from '../../dto/CalendarEntryDto';
import { isRRuleEntry, isRRuleOverrideEntry, isSingleEntry } from './helpers';

export type CalendarChange =
  | UpdateSingleOrRecurringTimeChange
  | UpdateSingleOrRecurringRruleChange
  | AddOverrideChange
  | UpdateOverrideChange
  | DeleteOverrideChange
  | AddExdateChange;

type ChangeBase = {
  changeType: string;
};

type SingleOrRecurringChangeBase<T> = ChangeBase & {
  uid: string;
  oldValue: T;
  newValue: T;
};

type UpdateSingleOrRecurringTimeChange = SingleOrRecurringChangeBase<{
  dtstart: DateTimeEntryDto;
  dtend: DateTimeEntryDto;
}> & {
  changeType: 'updateSingleOrRecurringTime';
};

type UpdateSingleOrRecurringRruleChange = SingleOrRecurringChangeBase<
  string | undefined
> & {
  changeType: 'updateSingleOrRecurringRrule';
};

type OverrideChangeBase = ChangeBase & {
  /**
   * Override entry.
   */
  value: CalendarEntryDto & {
    recurrenceId: DateTimeEntryDto;
  };
};

type AddOverrideChange = OverrideChangeBase & {
  changeType: 'addOverride';

  /**
   * Old occurrence start date and time.
   */
  oldDtstart: DateTimeEntryDto;

  /**
   * Old occurrence end date and time.
   */
  oldDtend: DateTimeEntryDto;
};

type UpdateOverrideChange = OverrideChangeBase & {
  changeType: 'updateOverride';

  /**
   * Previous override entry.
   */
  oldValue: CalendarEntryDto & {
    recurrenceId: DateTimeEntryDto;
  };
};

type DeleteOverrideChange = OverrideChangeBase & {
  changeType: 'deleteOverride';
};

type AddExdateChange = {
  changeType: 'addExdate';

  /**
   * Excluded occurrence start date and time.
   */
  dtstart: DateTimeEntryDto;

  /**
   * Excluded occurrence end date and time.
   */
  dtend: DateTimeEntryDto;
};

interface MapEntry {
  singleOrRecurringEntry?: CalendarEntryDto;
  overrideMap?: Map<
    number,
    CalendarEntryDto & {
      recurrenceId: DateTimeEntryDto;
    }
  >;
}

/**
 * Compares calendars of a recurring meeting modified by meetings widget and extracts calendar changes:
 *   - 'updateSingleOrRecurringTime' single or recurring entry time change
 *   - 'updateSingleOrRecurringRrule' single or recurring entry rrule change
 *   - 'addOverride', 'updateOverride', 'deleteOverride' override entries changes
 *   - 'addExdate' exdate added to rrule entry change
 */
export function extractCalendarChange(
  calendarEntries: CalendarEntryDto[],
  newCalendarEntries: CalendarEntryDto[],
): CalendarChange[] {
  const changes: CalendarChange[] = [];

  const map = new Map<string, MapEntry>();

  for (const calendarEntry of calendarEntries) {
    let mapEntry = map.get(calendarEntry.uid);
    if (!mapEntry) {
      mapEntry = {
        singleOrRecurringEntry:
          isSingleEntry(calendarEntry) || isRRuleEntry(calendarEntry)
            ? calendarEntry
            : undefined,
        overrideMap: undefined,
      };
      map.set(calendarEntry.uid, mapEntry);
    } else if (isSingleEntry(calendarEntry) || isRRuleEntry(calendarEntry)) {
      mapEntry.singleOrRecurringEntry = calendarEntry; // assign calendar entry if map entry was created by override
    }
    if (isRRuleOverrideEntry(calendarEntry)) {
      let overrideMap = mapEntry.overrideMap;
      if (!overrideMap) {
        overrideMap = new Map();
        mapEntry.overrideMap = overrideMap;
      }
      overrideMap.set(
        +parseICalDate(calendarEntry.recurrenceId),
        calendarEntry,
      );
    }
  }

  for (const newCalendarEntry of newCalendarEntries) {
    if (isRRuleOverrideEntry(newCalendarEntry)) {
      // handle override
      const calendarEntryOverride = map
        .get(newCalendarEntry.uid)
        ?.overrideMap?.get(+parseICalDate(newCalendarEntry.recurrenceId));
      if (calendarEntryOverride) {
        if (!isEqual(newCalendarEntry, calendarEntryOverride)) {
          changes.push({
            changeType: 'updateOverride',
            oldValue: calendarEntryOverride,
            value: newCalendarEntry,
          });
        }
      } else {
        const calendarEntry = map.get(newCalendarEntry.uid)
          ?.singleOrRecurringEntry;
        if (calendarEntry && isRRuleEntry(calendarEntry)) {
          const duration = parseICalDate(calendarEntry.dtend).diff(
            parseICalDate(calendarEntry.dtstart),
          );
          changes.push({
            changeType: 'addOverride',
            value: newCalendarEntry,
            oldDtstart: newCalendarEntry.recurrenceId,
            oldDtend: formatICalDate(
              parseICalDate(newCalendarEntry.recurrenceId).plus(duration),
              newCalendarEntry.recurrenceId.tzid,
            ),
          });
        }
      }
    } else {
      // handle series
      const calendarEntry = map.get(newCalendarEntry.uid)
        ?.singleOrRecurringEntry;
      if (
        isRRuleEntry(newCalendarEntry) &&
        calendarEntry &&
        isRRuleEntry(calendarEntry)
      ) {
        const newExdates = differenceWith(
          newCalendarEntry.exdate,
          calendarEntry.exdate ?? [],
          isEqual,
        );
        for (const exdate of newExdates) {
          const override = map
            .get(newCalendarEntry.uid)
            ?.overrideMap?.get(+parseICalDate(exdate));
          if (override) {
            changes.push({
              changeType: 'deleteOverride',
              value: override,
            });
          } else {
            const duration = parseICalDate(calendarEntry.dtend).diff(
              parseICalDate(calendarEntry.dtstart),
            );
            changes.push({
              changeType: 'addExdate',
              dtstart: exdate,
              dtend: formatICalDate(
                parseICalDate(exdate).plus(duration),
                exdate.tzid,
              ),
            });
          }
        }
      }
      if (calendarEntry) {
        if (
          !isEqual(
            {
              dtstart: newCalendarEntry.dtstart,
              dtend: newCalendarEntry.dtend,
            },
            {
              dtstart: calendarEntry.dtstart,
              dtend: calendarEntry.dtend,
            },
          )
        ) {
          changes.push({
            uid: newCalendarEntry.uid,
            changeType: 'updateSingleOrRecurringTime',
            oldValue: {
              dtstart: calendarEntry.dtstart,
              dtend: calendarEntry.dtend,
            },
            newValue: {
              dtstart: newCalendarEntry.dtstart,
              dtend: newCalendarEntry.dtend,
            },
          });
        }

        if (newCalendarEntry.rrule !== calendarEntry.rrule) {
          changes.push({
            changeType: 'updateSingleOrRecurringRrule',
            uid: newCalendarEntry.uid,
            oldValue: calendarEntry.rrule,
            newValue: newCalendarEntry.rrule,
          });
        }
      }
    }
  }

  return changes;
}
