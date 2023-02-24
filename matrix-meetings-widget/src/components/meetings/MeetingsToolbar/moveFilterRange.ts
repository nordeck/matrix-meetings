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

import { DateTime, DurationLike } from 'luxon';
import { generateFilterRange } from '../../../lib/utils';
import { ViewType } from '../MeetingsNavigation';

export type Direction = 'plus' | 'minus' | 'today';

export const moveFilterRange = (
  startDate: string,
  endDate: string,
  view: ViewType,
  direction: Direction
): { startDate: string; endDate: string } => {
  let diff: DurationLike = {};
  const days = Math.ceil(
    DateTime.fromISO(endDate).diff(DateTime.fromISO(startDate), 'day').days
  );

  if (view === 'day') {
    diff = { days: 1 };
  } else if (view === 'workWeek' || view === 'week') {
    diff = { week: 1 };
  } else if (view === 'month') {
    diff = { month: 1 };
  } else {
    diff = { days };
  }

  let startDateTime = DateTime.fromISO(startDate, {
    zone: 'local',
  }).startOf('day');

  if (direction === 'plus') {
    startDateTime = startDateTime.plus(diff);
  } else if (direction === 'minus') {
    startDateTime = startDateTime.minus(diff);
  } else {
    startDateTime = DateTime.local({ zone: 'local' }).startOf('day');
  }

  if (view === 'list') {
    return {
      startDate: startDateTime.toISO(),
      endDate: startDateTime
        .plus({
          days:
            // 'today' resets the list to the defaults
            direction === 'today' ? 6 : days - 1,
        })
        .endOf('day')
        .toISO(),
    };
  }

  return generateFilterRange(view, startDateTime.toISO());
};
