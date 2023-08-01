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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { TextFieldProps } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { renderTimeViewClock, TimePicker } from '@mui/x-date-pickers';
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

  const renderTimePickerDigital =
    getEnvironment('REACT_APP_RENDER_TIME_PICKER_DIGITAL', 'true') === 'true';

  useEffect(() => {
    setDate(value);
  }, [value]);

  const invalidDate = !date.isValid();

  const openDatePickerDialogue = useCallback(
    (date: Moment | null) => {
      return t(
        'dateTimePickers.openStartTimePicker',
        'Choose start time, selected time is  {{date, datetime}}',
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
      label={t('dateTimePickers.startTime', 'Start time')}
      onChange={handleOnChange}
      readOnly={Boolean(readOnly)}
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
            readOnly ||
            (invalidDate &&
              t('dateTimePickers.invalidStartTime', 'Invalid time')) ||
            (typeof error === 'string' ? error : undefined),
          margin: 'dense',
          ...TextFieldProps,
          error: !readOnly && (invalidDate || !!error || undefined),
        },
        popper: {
          sx: {
            '& .MuiDialogActions-root': {
              p: (theme) => theme.spacing(1),
            },
          },
        },
      }}
      viewRenderers={
        renderTimePickerDigital
          ? undefined
          : {
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
            }
      }
    />
  );
}
