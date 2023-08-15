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

import { SxProps } from '@mui/material';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFilterRange } from '../../../lib/utils';
import { ButtonDatePicker } from './ButtonDatePicker';
import { longDateFormat, shortMonthDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';

export type CalendarDayPickerProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const CalendarDayPicker = ({
  startDate,
  onRangeChange,
  sx,
}: CalendarDayPickerProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const start = useMemo(() => DateTime.fromISO(startDate), [startDate]);

  const handleRangeChange = useCallback(
    (value: DateTime | null) => {
      if (value?.isValid) {
        const date = value.toISO();
        const { startDate, endDate } = generateFilterRange('day', date);
        onRangeChange(startDate, endDate);
      }
    },
    [onRangeChange]
  );

  return (
    <ButtonDatePicker
      slotProps={{
        actionBar: ({ wrapperVariant }) => ({
          actions:
            wrapperVariant === 'mobile'
              ? ['today', 'cancel', 'accept']
              : ['today'],
        }),
        popper: {
          sx: {
            '& .MuiDialogActions-root': {
              p: (theme) => theme.spacing(1),
            },
          },
        },
        field: {
          inputProps: {
            'aria-label': t(
              'calendarDayPicker.chooseDate',
              'Choose date, selected date is {{date, datetime}}',
              {
                date: new Date(startDate),
                formatParams: {
                  date: longDateFormat,
                },
              }
            ),
          },
        },
      }}
      onAccept={handleRangeChange}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      sx={sx}
      reduceAnimations={isReduceAnimations()}
      showDaysOutsideCurrentMonth
      value={start}
      views={['year', 'month', 'day']}
      label={t('calendarDayPicker.label', '{{date, datetime}}', {
        date: new Date(startDate),
        formatParams: {
          date: shortMonthDateFormat,
        },
      })}
    />
  );
};
