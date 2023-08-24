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
import { DateTime, Interval } from 'luxon';
import React, { Dispatch, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonDatePicker } from './ButtonDatePicker';
import { HighlightedPickersDay } from './HighlightedPickersDay';
import { longDateFormat, shortMonthDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';

export type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const DateRangePicker = ({
  startDate,
  endDate,
  onRangeChange,
  sx,
}: DateRangePickerProps) => {
  const { t } = useTranslation();

  const [selectedStartDate, setSelectedStartDate] = useState<
    string | undefined
  >();
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(() => {
    // Nothing to do
  }, []);

  const handleDaySelect = useCallback(
    (value: DateTime | null) => {
      if (value?.isValid) {
        if (!selectedStartDate) {
          setSelectedStartDate(value.startOf('day').toISO());
        } else {
          onRangeChange(selectedStartDate, value.endOf('day').toISO());
          setSelectedStartDate(undefined);
          setOpen(false);
        }
      }
    },
    [onRangeChange, selectedStartDate],
  );

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => {
    setOpen(false);
    setSelectedStartDate(undefined);
  }, []);

  return (
    <ButtonDatePicker
      slots={{ day: Day as React.ElementType<PickersDayProps<DateTime>> }}
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
              'dateRangePicker.chooseDate',
              'Choose date range, selected range is {{range, daterange}}',
              {
                range: [new Date(startDate), new Date(endDate)],
                formatParams: {
                  range: longDateFormat,
                },
              },
            ),
          },
        },
        day: {
          selectedStartDate,
          startDate,
          endDate,
          onDaySelect: handleDaySelect,
        } as DatePickerSlotsComponentsProps<DateTime>['day'] & {
          selectedStartDate?: string;
          startDate: string;
          endDate: string;
          onDaySelect: Dispatch<DateTime | null>;
        },
      }}
      closeOnSelect={false}
      minDate={
        selectedStartDate ? DateTime.fromISO(selectedStartDate) : undefined
      }
      onChange={handleChange}
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      sx={sx}
      reduceAnimations={isReduceAnimations()}
      showDaysOutsideCurrentMonth
      value={DateTime.fromISO(selectedStartDate ?? startDate)}
      views={['year', 'month', 'day']}
      label={t('dateRangePicker.dateRange', '{{range, daterange}}', {
        range: [new Date(startDate), new Date(endDate)],
        formatParams: {
          range: shortMonthDateFormat,
        },
      })}
    />
  );
};

function Day(
  props: PickersDayProps<DateTime> & {
    selectedStartDate?: string;
    startDate: string;
    endDate: string;
    onDaySelect: Dispatch<DateTime | null>;
  },
) {
  const { day, selectedStartDate, startDate, endDate, onDaySelect, ...other } =
    props;

  const isFirstDay = DateTime.fromISO(selectedStartDate ?? startDate).hasSame(
    day,
    'day',
  );
  const isLastDay =
    !selectedStartDate && DateTime.fromISO(endDate).hasSame(day, 'day');
  const isBetween =
    !selectedStartDate &&
    Interval.fromDateTimes(
      DateTime.fromISO(startDate),
      DateTime.fromISO(endDate).plus(1),
    ).contains(day);

  return (
    <HighlightedPickersDay
      isBetween={isBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
      onDaySelect={onDaySelect}
      {...other}
      day={day}
    />
  );
}
