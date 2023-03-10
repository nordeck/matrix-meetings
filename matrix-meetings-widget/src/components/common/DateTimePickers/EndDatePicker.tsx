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

import { TextField, TextFieldProps } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { longDateFormat } from './dateFormat';
import { isReduceAnimations } from './helper';

type EndDatePickerProps = {
  value: Moment;
  error?: boolean | string;
  enablePast?: boolean;
  onChange: Dispatch<Moment>;
  TextFieldProps?: Partial<TextFieldProps>;
};

export function EndDatePicker({
  value,
  error,
  enablePast = false,
  onChange,
  TextFieldProps,
}: EndDatePickerProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(value);

  useEffect(() => {
    setDate(value);
  }, [value]);

  const renderInput = useCallback(
    (props: TextFieldProps) => {
      const invalidDate = !date.isValid();

      return (
        <TextField
          fullWidth
          helperText={
            (invalidDate &&
              t('dateTimePickers.invalidEndDate', 'Invalid date')) ||
            (typeof error === 'string' ? error : undefined)
          }
          margin="dense"
          {...props}
          {...TextFieldProps}
          error={invalidDate || !!error || props.error}
        />
      );
    },
    [TextFieldProps, date, error, t]
  );

  const getOpenDialogAriaText = useCallback(
    (date: Moment) => {
      return t(
        'dateTimePickers.openEndDatePicker',
        'Choose end date, selected date is {{date, datetime}}',
        {
          date: date.toDate(),
          formatParams: {
            date: longDateFormat,
          },
        }
      );
    },
    [t]
  );

  const handleOnChange = useCallback(
    (date: Moment | null) => {
      // It is necessary to clone the moment object
      // (https://github.com/mui/material-ui-pickers/issues/359#issuecomment-381566442)
      const newValue = moment(date?.toDate())
        .hours(value.hours())
        .minutes(value.minutes())
        .startOf('minute');

      setDate(newValue);

      if (date?.isValid()) {
        onChange(newValue);
      }
    },
    [onChange, value]
  );

  return (
    <DatePicker
      disablePast={!enablePast}
      getOpenDialogAriaText={getOpenDialogAriaText}
      label={t('dateTimePickers.endDate', 'End date')}
      onChange={handleOnChange}
      reduceAnimations={isReduceAnimations()}
      renderInput={renderInput}
      value={date}
      views={['year', 'month', 'day']}
    />
  );
}
