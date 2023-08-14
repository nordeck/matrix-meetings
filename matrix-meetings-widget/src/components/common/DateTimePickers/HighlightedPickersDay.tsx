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

import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';

export function HighlightedPickersDay({
  isFirstDay,
  isBetween,
  isLastDay,
  ...pickersDayProps
}: PickersDayProps<DateTime> & {
  /** If true, the selected date is part of the selection. */
  isBetween: boolean | undefined;
  /** If true, the selected date is the first day of the selection. */
  isFirstDay: boolean | undefined;
  /** If true, the selected date is the last day of the selection. */
  isLastDay: boolean | undefined;
}) {
  return (
    <PickersDay
      sx={{
        ...(isBetween && {
          px: 2.5,
          mx: 0,
          borderColor: 'primary.main',
          borderRadius: 0,
          borderWidth: 1,
          borderTopStyle: 'solid',
          borderBottomStyle: 'solid',
        }),
        ...(isFirstDay &&
          !isLastDay && {
            borderTopLeftRadius: '50%',
            borderBottomLeftRadius: '50%',
            borderLeftStyle: 'solid',
          }),
        ...(isLastDay &&
          !isFirstDay && {
            borderTopRightRadius: '50%',
            borderBottomRightRadius: '50%',
            borderRightStyle: 'solid',
          }),
      }}
      {...pickersDayProps}
      selected={isFirstDay || isLastDay}
    />
  );
}
