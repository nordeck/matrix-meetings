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
import { DatePicker, PickersDayProps } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateFilterRange } from '../../../lib/utils';
import { longDateFormat, shortMonthDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';
import { HighlightedPickersDay } from './HighlightedPickersDay';

export type CalendarWeekPickerProps = {
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  sx?: SxProps;
};

export const CalendarWeekPicker = ({
  startDate,
  endDate,
  onRangeChange,
  sx,
}: CalendarWeekPickerProps) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const onToggle = useCallback(() => setOpen((old) => !old), []);

  const startMoment = useMemo(() => moment(startDate), [startDate]);
  const endMoment = useMemo(() => moment(endDate), [endDate]);

  const handleChange = useCallback(() => {
    // Nothing to do
  }, []);

  const handleRangeChange = useCallback(
    (value: Moment | null) => {
      if (value?.isValid()) {
        const date = value.toISOString();
        const { startDate, endDate } = generateFilterRange('week', date);
        onRangeChange(startDate, endDate);
        onClose();
      }
    },
    [onRangeChange, onClose]
  );

  const renderInput = useCallback(() => <Fragment />, []);

  const renderDay = useCallback(
    (day: Moment, _: Moment[], pickersDayProps: PickersDayProps<Moment>) => {
      const isFirstDay = startMoment?.isSame(day, 'day');
      const isLastDay = endMoment?.isSame(day, 'day');
      const isBetween = day.isBetween(startMoment, endMoment, 'day');

      return (
        <HighlightedPickersDay
          isBetween={isBetween}
          isFirstDay={isFirstDay}
          isLastDay={isLastDay}
          {...pickersDayProps}
          onDaySelect={handleRangeChange}
        />
      );
    },
    [startMoment, endMoment, handleRangeChange]
  );
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        aria-label={t(
          'calendarWeekPicker.chooseWeek',
          'Choose week, selected week is {{range, daterange}}',
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
        {t('calendarWeekPicker.label', '{{range, daterange}}', {
          range: [new Date(startDate), new Date(endDate)],
          formatParams: {
            range: shortMonthDateFormat,
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
        value={startMoment}
        views={['year', 'month', 'day']}
      />
    </>
  );
};
