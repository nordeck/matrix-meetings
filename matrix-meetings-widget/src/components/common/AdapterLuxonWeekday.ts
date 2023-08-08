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

import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import { generateFilterRange, localeWeekdays } from '../../lib/utils';

/**
 * Custom Luxon Adapter that generates weekdays starting from the day determined by locale.
 */
export class AdapterLuxonWeekday extends AdapterLuxon {
  public getWeekdays = () => {
    return localeWeekdays('narrow', true);
  };

  public getWeekArray = (value: DateTime) => {
    // implementation is copied from MUI-X with small modifications: https://github.com/mui/mui-x/blob/e5e7374d8753a59000a52d3d0ceb55c9ad7784d2/packages/x-date-pickers/src/AdapterLuxon/AdapterLuxon.ts#L528
    // and modified to use normalized start/end of week to support weeks starting from day other than Monday.
    const cleanValue = value;

    const expectedLocale = this.getCurrentLocaleCode();
    if (expectedLocale !== value.locale) {
      cleanValue.setLocale(expectedLocale);
    }

    const normStartOfMonth = DateTime.fromISO(
      generateFilterRange('week', cleanValue.startOf('month').toISO()).startDate
    );
    const normEndOfMonth = DateTime.fromISO(
      generateFilterRange('week', cleanValue.endOf('month').toISO()).endDate
    );

    const { days } = normEndOfMonth.diff(normStartOfMonth, 'days').toObject();

    const weeks: DateTime[][] = [];
    new Array<number>(Math.round(days!))
      .fill(0)
      .map((_, i) => i)
      .map((day) => normStartOfMonth.plus({ days: day }))
      .forEach((v, i) => {
        if (i === 0 || (i % 7 === 0 && i > 6)) {
          weeks.push([v]);
          return;
        }

        weeks[weeks.length - 1].push(v);
      });

    return weeks;
  };
}
