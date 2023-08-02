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

import { TextFieldProps } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { TimePicker } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { timeOnlyDateFormat } from './dateFormat';

type EndTimePickerProps = {
  value: Moment;
  error?: boolean | string;
  hideHelperText?: boolean;
  onChange: Dispatch<Moment>;
  TextFieldProps?: Partial<TextFieldProps>;
};

export function EndTimePicker({
  value,
  error,
  hideHelperText,
  onChange,
  TextFieldProps,
}: EndTimePickerProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(value);

  useEffect(() => {
    setDate(value);
  }, [value]);

  const invalidDate = !date.isValid();

  const openDatePickerDialogue = useCallback(
    (date: Moment | null) => {
      return t(
        'dateTimePickers.openEndTimePicker',
        'Choose end time, selected time is  {{date, datetime}}',
        {
          date: date?.toDate(),
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
      label={t('dateTimePickers.endTime', 'End time')}
      onChange={handleOnChange}
      value={date}
      slotProps={{
        openPickerButton: {
          'aria-label': openDatePickerDialogue(value),
        },
        textField: {
          FormHelperTextProps: {
            sx: hideHelperText ? visuallyHidden : undefined,
          },
          fullWidth: true,
          helperText:
            (invalidDate &&
              t('dateTimePickers.invalidEndTime', 'Invalid time')) ||
            (typeof error === 'string' ? error : undefined),
          margin: 'dense',
          ...TextFieldProps,
          error: invalidDate || !!error || undefined,
        },
        popper: {
          sx: {
            '& .MuiDialogActions-root': {
              p: (theme) => theme.spacing(1),
            },
          },
        },
      }}
    />
  );
}
