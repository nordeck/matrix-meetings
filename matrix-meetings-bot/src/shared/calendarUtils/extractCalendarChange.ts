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

import { differenceWith, isEqual } from 'lodash';
import { CalendarEntryDto, DateTimeEntryDto } from '../../dto/CalendarEntryDto';
import { formatICalDate, parseICalDate } from '../dateTimeUtils';
import { isRRuleEntry, isRRuleOverrideEntry } from './helpers';

export type OccurrenceChange =
  | AddChange
  | UpdateChange
  | DeleteChange
  | ExdateChange;

type OverrideChangeBase = {
  changeType: string;

  /**
   * Override entry.
   */
  value: CalendarEntryDto & {
    recurrenceId: DateTimeEntryDto;
  };
};

type AddChange = OverrideChangeBase & {
  changeType: 'add';

  /**
   * Overriden occurrence end date and time.
   */
  dtend: DateTimeEntryDto;
};

type UpdateChange = OverrideChangeBase & {
  changeType: 'update';

  /**
   * Previous override entry.
   */
  oldValue: CalendarEntryDto & {
    recurrenceId: DateTimeEntryDto;
  };
};

type DeleteChange = OverrideChangeBase & {
  changeType: 'delete';
};

type ExdateChange = {
  changeType: 'exdate';

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
  rruleEntry?: CalendarEntryDto & { rrule: string };
  overrideMap?: Map<
    number,
    CalendarEntryDto & {
      recurrenceId: DateTimeEntryDto;
    }
  >;
}

/**
 * Compares calendars of a recurring meeting modified by meetings widget and extracts occurrences changes:
 *   - 'add', 'update', 'delete' override entries
 *   - 'exdate' added to rrule entry
 */
export function extractCalendarChange(
  calendarEntries: CalendarEntryDto[],
  newCalendarEntries: CalendarEntryDto[],
): OccurrenceChange[] {
  const changes: OccurrenceChange[] = [];

  const map = new Map<string, MapEntry>();

  for (const ce of calendarEntries) {
    if (isRRuleEntry(ce) || isRRuleOverrideEntry(ce)) {
      let mapEntry = map.get(ce.uid);
      if (!mapEntry) {
        mapEntry = {
          rruleEntry: isRRuleEntry(ce) ? ce : undefined,
          overrideMap: undefined,
        };
        map.set(ce.uid, mapEntry);
      }
      if (isRRuleOverrideEntry(ce)) {
        let overrideMap = mapEntry.overrideMap;
        if (!overrideMap) {
          overrideMap = new Map();
          mapEntry.overrideMap = overrideMap;
        }
        overrideMap.set(+parseICalDate(ce.recurrenceId), ce);
      }
    }
  }

  for (const nce of newCalendarEntries) {
    if (isRRuleOverrideEntry(nce)) {
      // handle override
      const ceOverride = map
        .get(nce.uid)
        ?.overrideMap?.get(+parseICalDate(nce.recurrenceId));
      if (ceOverride) {
        if (!isEqual(nce, ceOverride)) {
          changes.push({
            changeType: 'update',
            oldValue: ceOverride,
            value: nce,
          });
        }
      } else {
        const ce = map.get(nce.uid)?.rruleEntry;
        if (ce) {
          const duration = parseICalDate(ce.dtend).diff(
            parseICalDate(ce.dtstart),
          );
          changes.push({
            changeType: 'add',
            value: nce,
            dtend: formatICalDate(
              parseICalDate(nce.recurrenceId).plus(duration),
              nce.recurrenceId.tzid,
            ),
          });
        }
      }
    } else if (isRRuleEntry(nce)) {
      // handle series
      const ce = map.get(nce.uid)?.rruleEntry;
      if (ce) {
        const newExdates = differenceWith(nce.exdate, ce.exdate ?? [], isEqual);
        for (const exdate of newExdates) {
          const override = map
            .get(nce.uid)
            ?.overrideMap?.get(+parseICalDate(exdate));
          if (override) {
            changes.push({
              changeType: 'delete',
              value: override,
            });
          } else {
            const duration = parseICalDate(ce.dtend).diff(
              parseICalDate(ce.dtstart),
            );
            changes.push({
              changeType: 'exdate',
              dtstart: exdate,
              dtend: formatICalDate(
                parseICalDate(exdate).plus(duration),
                exdate.tzid,
              ),
            });
          }
        }
      }
    }
  }

  return changes;
}
