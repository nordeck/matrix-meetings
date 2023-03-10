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
import { visuallyHidden } from '@mui/utils';
import { TimePicker } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { timeOnlyDateFormat } from './dateFormat';

type StartTimePickerProps = {
  value: Moment;
  onChange: Dispatch<Moment>;
  TextFieldProps?: Partial<TextFieldProps>;

  /** If true, all helper texts are hidden. This affects both `error` and `readOnly`. */
  hideHelperText?: boolean;

  /**
   * If set, the field is invalid and shows the text below the field.
   *
   * This setting is overridden by the `readOnly` flag.
   */
  error?: boolean | string;

  /**
   * If set, the field is readOnly and shows the text below the field.
   *
   * This setting overrides the `error` flag.
   */
  readOnly?: string;
};

export function StartTimePicker({
  value,
  error,
  readOnly,
  hideHelperText,
  onChange,
  TextFieldProps,
}: StartTimePickerProps) {
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
          FormHelperTextProps={{
            sx: hideHelperText ? visuallyHidden : undefined,
          }}
          fullWidth
          helperText={
            readOnly ||
            (invalidDate &&
              t('dateTimePickers.invalidStartTime', 'Invalid time')) ||
            (typeof error === 'string' ? error : undefined)
          }
          margin="dense"
          {...props}
          {...TextFieldProps}
          error={!readOnly && (invalidDate || !!error || props.error)}
        />
      );
    },
    [TextFieldProps, date, error, hideHelperText, readOnly, t]
  );

  const getOpenDialogAriaText = useCallback(
    (date: Moment) => {
      return t(
        'dateTimePickers.openStartTimePicker',
        'Choose start time, selected time is  {{date, datetime}}',
        {
          date: date.toDate(),
          formatParams: {
            date: timeOnlyDateFormat,
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
      const newValue = moment(date?.toDate()).seconds(0).milliseconds(0);

      setDate(newValue);

      if (date?.isValid()) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <TimePicker
      getOpenDialogAriaText={getOpenDialogAriaText}
      label={t('dateTimePickers.startTime', 'Start time')}
      onChange={handleOnChange}
      readOnly={Boolean(readOnly)}
      renderInput={renderInput}
      value={date}
    />
  );
}
