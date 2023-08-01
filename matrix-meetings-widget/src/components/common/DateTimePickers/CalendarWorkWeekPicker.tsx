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
import {
  DatePickerSlotsComponentsProps,
  PickersDayProps,
} from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFilterRange } from '../../../lib/utils';
import { ButtonDatePicker, ButtonFieldProps } from './ButtonDatePicker';
import { longDateFormat, shortMonthDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';
import { HighlightedPickersDay } from './HighlightedPickersDay';

export type CalendarWorkWeekPickerProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const CalendarWorkWeekPicker = ({
  startDate,
  endDate,
  onRangeChange,
  sx,
}: CalendarWorkWeekPickerProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const startMoment = useMemo(() => moment(startDate), [startDate]);
  const endMoment = useMemo(() => moment(endDate), [endDate]);

  const handleRangeChange = useCallback(
    (value: Moment | null) => {
      if (value?.isValid()) {
        const date = value.toISOString();
        const { startDate, endDate } = generateFilterRange('workWeek', date);
        onRangeChange(startDate, endDate);
        onClose();
      }
    },
    [onRangeChange, onClose]
  );

  return (
    <ButtonDatePicker
      slots={{ day: Day }}
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
              'calendarWorkWeekPicker.chooseWorkWeek',
              'Choose work week, selected work week is {{range, daterange}}',
              {
                range: [new Date(startDate), new Date(endDate)],
                formatParams: {
                  range: longDateFormat,
                },
              }
            ),
          },
          open,
        } as ButtonFieldProps,
        day: {
          startMoment,
          endMoment,
        } as DatePickerSlotsComponentsProps<moment.Moment>['day'] & {
          startMoment?: moment.Moment;
          endMoment?: moment.Moment;
        },
      }}
      onAccept={handleRangeChange}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      sx={sx}
      reduceAnimations={isReduceAnimations()}
      showDaysOutsideCurrentMonth
      value={endMoment}
      views={['year', 'month', 'day']}
      label={t('calendarWorkWeekPicker.label', '{{range, daterange}}', {
        range: [new Date(startDate), new Date(endDate)],
        formatParams: {
          range: shortMonthDateFormat,
        },
      })}
    />
  );
};

function Day(
  props: PickersDayProps<moment.Moment> & {
    startMoment?: moment.Moment;
    endMoment?: moment.Moment;
  }
) {
  const { day, startMoment, endMoment, ...other } = props;

  const isFirstDay = startMoment?.isSame(day, 'day');
  const isLastDay = endMoment?.isSame(day, 'day');
  const isBetween = day.isBetween(startMoment, endMoment, 'day');

  return (
    <HighlightedPickersDay
      isBetween={isBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
      {...other}
      day={day}
    />
  );
}
