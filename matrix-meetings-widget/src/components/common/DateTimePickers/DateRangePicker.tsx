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

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, SxProps } from '@mui/material';
import { DesktopDatePicker, PickersDayProps } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { longDateFormat, shortMonthDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';
import { HighlightedPickersDay } from './HighlightedPickersDay';

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
    (value: Moment | null) => {
      if (value?.isValid()) {
        if (!selectedStartDate) {
          setSelectedStartDate(value.startOf('day').toISOString());
        } else {
          onRangeChange(selectedStartDate, value.endOf('day').toISOString());
          setSelectedStartDate(undefined);
          setOpen(false);
        }
      }
    },
    [onRangeChange, selectedStartDate]
  );

  const onOpen = useCallback(() => setOpen(true), []);
  const onToggle = useCallback(() => setOpen((old) => !old), []);
  const onClose = useCallback(() => {
    setOpen(false);
    setSelectedStartDate(undefined);
  }, []);

  const renderInput = useCallback(() => <Fragment />, []);

  const renderDay = useCallback(
    (day: Moment, _: Moment[], pickersDayProps: PickersDayProps<Moment>) => {
      const isFirstDay = moment(selectedStartDate ?? startDate).isSame(
        day,
        'day'
      );
      const isLastDay =
        !selectedStartDate && moment(endDate).isSame(day, 'day');
      const isBetween =
        !selectedStartDate && day.isBetween(startDate, moment(endDate), 'day');

      return (
        <HighlightedPickersDay
          isBetween={isBetween}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
          {...pickersDayProps}
          onDaySelect={handleDaySelect}
        />
      );
    },
    [endDate, handleDaySelect, selectedStartDate, startDate]
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        aria-label={t(
          'dateRangePicker.chooseDate',
          'Choose date range, selected range is {{range, daterange}}',
          {
            range: [new Date(startDate), new Date(endDate)],
            formatParams: {
              range: longDateFormat,
            },
          }
        )}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        onClick={onToggle}
        ref={buttonRef}
        sx={sx}
      >
        {t('dateRangePicker.dateRange', '{{range, daterange}}', {
          range: [new Date(startDate), new Date(endDate)],
          formatParams: {
            range: shortMonthDateFormat,
          },
        })}
      </Button>
      <DesktopDatePicker
        PopperProps={{
          anchorEl: buttonRef.current,
          sx: {
            '& .MuiTypography-caption': {
              margin: 0,
            },
            '& .MuiDialogActions-root': {
              p: (theme) => theme.spacing(1),
            },
          },
        }}
        closeOnSelect={false}
        minDate={selectedStartDate ? moment(selectedStartDate) : undefined}
        onChange={handleChange}
        onClose={onClose}
        onOpen={onOpen}
        open={open}
        reduceAnimations={isReduceAnimations()}
        renderDay={renderDay}
        renderInput={renderInput}
        showDaysOutsideCurrentMonth
        value={selectedStartDate ?? startDate}
        views={['year', 'month', 'day']}
      />
    </>
  );
};
