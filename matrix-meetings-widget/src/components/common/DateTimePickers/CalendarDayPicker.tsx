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
import { DatePicker, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { Moment } from 'moment';
import { Fragment, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFilterRange } from '../../../lib/utils';
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
  const onToggle = useCallback(() => setOpen((old) => !old), []);

  const handleChange = useCallback(() => {
    // Nothing to do
  }, []);

  const handleRangeChange = useCallback(
    (value: Moment | null) => {
      if (value?.isValid()) {
        const date = value.toISOString();
        const { startDate, endDate } = generateFilterRange('day', date);
        onRangeChange(startDate, endDate);
        onClose();
      }
    },
    [onRangeChange, onClose]
  );

  const renderInput = useCallback(() => <Fragment />, []);

  const renderDay = useCallback(
    (
      _day: Moment,
      _selectedDays: Moment[],
      pickersDayProps: PickersDayProps<Moment>
    ) => {
      return (
        <PickersDay {...pickersDayProps} onDaySelect={handleRangeChange} />
      );
    },
    [handleRangeChange]
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <Button
        aria-label={t(
          'calendarDayPicker.chooseDate',
          'Choose date, selected date is {{date, datetime}}',
          {
            date: new Date(startDate),
            formatParams: {
              date: longDateFormat,
            },
          }
        )}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        onClick={onToggle}
        ref={buttonRef}
        sx={sx}
      >
        {t('calendarDayPicker.label', '{{date, datetime}}', {
          date: new Date(startDate),
          formatParams: {
            date: shortMonthDateFormat,
          },
        })}
      </Button>

      <DatePicker
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
        componentsProps={{
          actionBar: {
            actions: (v) =>
              v === 'mobile' ? ['today', 'cancel', 'accept'] : ['today'],
          },
        }}
        onChange={handleChange}
        onClose={onClose}
        onOpen={onOpen}
        open={open}
        reduceAnimations={isReduceAnimations()}
        renderDay={renderDay}
        renderInput={renderInput}
        showDaysOutsideCurrentMonth
        value={startDate}
        views={['year', 'month', 'day']}
      />
    </>
  );
};
