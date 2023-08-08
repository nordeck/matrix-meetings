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
  isFirstDay?: boolean;
  isBetween?: boolean;
  isLastDay?: boolean;
}) {
  return (
    <PickersDay
      sx={{
        ...(isFirstDay || isBetween || isLastDay ? { px: 2.5, mx: 0 } : {}),
        ...(isFirstDay &&
          !isLastDay && {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderColor: 'primary.main',
            borderTopStyle: 'solid',
            borderLeftStyle: 'solid',
            borderBottomStyle: 'solid',
            borderWidth: 1,
          }),
        ...(isLastDay &&
          !isFirstDay && {
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderColor: 'primary.main',
            borderTopStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            borderWidth: 1,
          }),
        ...(isBetween && {
          borderTopColor: 'primary.main',
          borderBottomColor: 'primary.main',
          borderRadius: 0,
          borderTopStyle: 'solid',
          borderBottomStyle: 'solid',
          borderTopWidth: 1,
          borderBottomWidth: 1,
        }),
      }}
      {...pickersDayProps}
      selected={isFirstDay || isLastDay}
    />
  );
}
