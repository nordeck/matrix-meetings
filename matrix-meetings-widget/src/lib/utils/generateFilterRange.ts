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

import { DateTime, Duration } from 'luxon';
import moment from 'moment';
import { ViewType } from '../../components/meetings/MeetingsNavigation';

export type CalendarViewType = 'day' | 'workWeek' | 'week' | 'month';

export const generateFilterRange = (
  view: CalendarViewType,
  date: string,
  previousView?: ViewType
): { startDate: string; endDate: string } => {
  // luxon only supports isoWeekday always returns a day-of-week=1.
  // this duration normalizes it to the configured locale
  const normalizeDuration = Duration.fromObject({
    day:
      DateTime.now().startOf('week').weekday -
      moment.localeData().firstDayOfWeek(),
  });

  // Interpret the ISO-date in local time so the startOf and endOf
  // operations are correct.
  const referenceDate = DateTime.fromISO(date, { zone: 'local' });

  if (view === 'day') {
    const startDate = referenceDate.startOf('day');
    return {
      startDate: startDate.toISO(),
      endDate: startDate.endOf('day').toISO(),
    };
  }

  if (view === 'week') {
    let startDate = referenceDate
      .plus(normalizeDuration)
      .startOf('week')
      .minus(normalizeDuration);
    if (previousView === 'month') {
      if (startDate.day !== referenceDate.day)
        startDate = startDate.plus({ week: 1 });
    }
    return {
      startDate: startDate.toISO(),
      endDate: startDate.plus({ days: 6 }).endOf('day').toISO(),
    };
  }

  if (view === 'workWeek') {
    const startDate = referenceDate.plus(normalizeDuration).startOf('week');
    return {
      startDate: startDate.toISO(),
      endDate: startDate.plus({ days: 4 }).endOf('day').toISO(),
    };
  }

  if (view === 'month') {
    const startDate = referenceDate.startOf('month');
    return {
      startDate: startDate.toISO(),
      endDate: referenceDate.endOf('month').toISO(),
    };
  }

  throw new Error(`unexpected view: ${view}`);
};
