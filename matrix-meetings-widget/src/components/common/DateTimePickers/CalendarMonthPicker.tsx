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
import moment, { Moment } from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFilterRange } from '../../../lib/utils';
import { ButtonDatePicker, ButtonFieldProps } from './ButtonDatePicker';
import { withoutDayDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';

export type CalendarMonthPickerProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const CalendarMonthPicker = ({
  startDate,
  onRangeChange,
  sx,
}: CalendarMonthPickerProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const startMoment = useMemo(() => moment(startDate), [startDate]);

  const handleRangeChange = useCallback(
    (value: Moment | null) => {
      if (value?.isValid()) {
        const date = value.toISOString();
        const { startDate, endDate } = generateFilterRange('month', date);
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
            '& .MuiTypography-caption': {
              margin: 0,
            },
            '& .MuiDialogActions-root': {
              p: (theme) => theme.spacing(1),
            },
          },
        },
        field: {
          inputProps: {
            'aria-label': t(
              'calendarMonthPicker.chooseMonth',
              'Choose month, selected month is {{date, datetime}}',
              {
                date: new Date(startDate),
                formatParams: {
                  date: withoutDayDateFormat,
                },
              }
            ),
          },
          open,
          setOpen,
        } as ButtonFieldProps,
      }}
      onAccept={handleRangeChange}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      openTo="month"
      sx={sx}
      reduceAnimations={isReduceAnimations()}
      showDaysOutsideCurrentMonth
      value={startMoment}
      views={['year', 'month']}
      label={t('calendarMonthPicker.label', '{{date, datetime}}', {
        date: new Date(startDate),
        formatParams: {
          date: withoutDayDateFormat,
        },
      })}
    />
  );
};
