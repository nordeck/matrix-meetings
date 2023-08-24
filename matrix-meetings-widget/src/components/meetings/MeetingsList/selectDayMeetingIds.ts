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

import { createSelector } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { Filters, makeSelectAllMeetingIds } from '../../../reducer/meetingsApi';
import {
  MeetingIdEntry,
  SelectAllMeetingIdsOpts,
} from '../../../reducer/meetingsApi/selectors/selectAllMeetingIds';
import { RootState } from '../../../store';

export function makeSelectDayMeetingIds(
  opts?: SelectAllMeetingIdsOpts,
): (
  state: RootState,
  filters: Filters,
) => Array<{ day: string; meetingIds: MeetingIdEntry[] }> {
  const selectAllMeetingIds = makeSelectAllMeetingIds(opts);

  return createSelector(selectAllMeetingIds, (allMeetingIds) => {
    const entries = [];

    if (allMeetingIds.length > 0) {
      let entry: { day: string; meetingIds: MeetingIdEntry[] } | undefined;

      for (let i = 0; i < allMeetingIds.length; i++) {
        const idEntry = allMeetingIds[i];

        if (
          !entry ||
          !DateTime.fromISO(entry.day).hasSame(
            DateTime.fromISO(idEntry.startTime),
            'day',
          )
        ) {
          entry = { day: idEntry.startTime, meetingIds: [idEntry] };
          entries.push(entry);
        } else {
          entry.meetingIds.push(idEntry);
        }
      }
    }

    return entries;
  });
}
