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

import {
  FormControl,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { TFunction } from 'i18next';
import { ChangeEvent, Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Frequency } from 'rrule';
import { CustomRuleMode } from '../state';
import { CustomMonthlyRecurringMeeting } from './CustomMonthlyRecurringMeeting';
import { CustomWeeklyRecurringMeeting } from './CustomWeeklyRecurringMeeting';
import { CustomYearlyRecurringMeeting } from './CustomYearlyRecurringMeeting';

type CustomRecurringMeetingProps = {
  customFrequency: Frequency;
  customInterval: string;
  customByWeekday: number[];
  customRuleMode: CustomRuleMode;
  customMonth: number;
  customNthMonthday: string;
  customWeekday: number;
  customNth: number;
  disabled?: boolean;
  onCustomFrequencyChange: Dispatch<Frequency>;
  onCustomIntervalChange: Dispatch<string>;
  onCustomByWeekdayChange: Dispatch<number[]>;
  onCustomRuleModeChange: Dispatch<CustomRuleMode>;
  onCustomMonthChange: Dispatch<number>;
  onCustomNthMonthdayChange: Dispatch<string>;
  onCustomWeekdayChange: Dispatch<number>;
  onCustomNthChange: Dispatch<number>;
};

export const CustomRecurringMeeting = ({
  customFrequency,
  customInterval,
  customByWeekday,
  customRuleMode,
  customMonth,
  customNthMonthday,
  customWeekday,
  customNth,
  disabled,
  onCustomFrequencyChange,
  onCustomIntervalChange,
  onCustomByWeekdayChange,
  onCustomRuleModeChange,
  onCustomMonthChange,
  onCustomNthMonthdayChange,
  onCustomWeekdayChange,
  onCustomNthChange,
}: CustomRecurringMeetingProps) => {
  const { t } = useTranslation();
  const customIntervalParsed = parseInt(customInterval);
  const isCustomIntervalInvalid =
    isNaN(customIntervalParsed) || customIntervalParsed < 1;

  const handleFrequencyChange = useCallback(
    (e: SelectChangeEvent<Frequency>) => {
      onCustomFrequencyChange(e.target.value as Frequency);
    },
    [onCustomFrequencyChange],
  );

  const handleIntervalChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onCustomIntervalChange(e.target.value);
    },
    [onCustomIntervalChange],
  );

  const repetitionLabelId = useId();
  const repetitionSelectId = useId();

  return (
    <FormControl component="fieldset" sx={{ mb: 1, display: 'block' }}>
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {t('recurrenceEditor.custom.title', 'Custom recurring meeting')}
      </FormLabel>
      <Stack alignItems="baseline" direction="row" flexWrap="wrap" spacing={1}>
        <span>{t('recurrenceEditor.custom.repeatEvery', 'Repeat every')}</span>
        <TextField
          error={isCustomIntervalInvalid}
          helperText={
            isCustomIntervalInvalid &&
            t('recurrenceEditor.custom.invalidInput', 'Invalid input')
          }
          inputProps={{
            'aria-label': t(
              'recurrenceEditor.custom.intervalLabel',
              '{{frequencyLabel}} until the appointment is repeated',
              { frequencyLabel: formatFrequency(customFrequency, t) },
            ),
            inputMode: 'numeric',
            type: 'number',
            min: 1,
            // Setting a max value restricts the width of the input
            max: 9999,
          }}
          margin="dense"
          onChange={handleIntervalChange}
          value={customInterval}
          disabled={disabled}
        />
        <FormControl>
          <InputLabel id={repetitionLabelId} sx={visuallyHidden}>
            {t('recurrenceEditor.custom.frequencyLabel', 'Repeat')}
          </InputLabel>
          <Select
            id={repetitionSelectId}
            labelId={repetitionLabelId}
            onChange={handleFrequencyChange}
            value={customFrequency}
            disabled={disabled}
          >
            {[
              Frequency.DAILY,
              Frequency.WEEKLY,
              Frequency.MONTHLY,
              Frequency.YEARLY,
            ].map((f) => (
              <MenuItem key={f} value={f}>
                {formatFrequency(f, t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {customFrequency === Frequency.WEEKLY && (
        <CustomWeeklyRecurringMeeting
          byWeekday={customByWeekday}
          onByWeekdayChange={onCustomByWeekdayChange}
          disabled={disabled}
        />
      )}

      {customFrequency === Frequency.MONTHLY && (
        <CustomMonthlyRecurringMeeting
          customNth={customNth}
          customNthMonthday={customNthMonthday}
          customRuleMode={customRuleMode}
          customWeekday={customWeekday}
          onCustomNthChange={onCustomNthChange}
          onCustomNthMonthdayChange={onCustomNthMonthdayChange}
          onCustomRuleModeChange={onCustomRuleModeChange}
          onCustomWeekdayChange={onCustomWeekdayChange}
          disabled={disabled}
        />
      )}

      {customFrequency === Frequency.YEARLY && (
        <CustomYearlyRecurringMeeting
          customMonth={customMonth}
          customNth={customNth}
          customNthMonthday={customNthMonthday}
          customRuleMode={customRuleMode}
          customWeekday={customWeekday}
          onCustomMonthChange={onCustomMonthChange}
          onCustomNthChange={onCustomNthChange}
          onCustomNthMonthdayChange={onCustomNthMonthdayChange}
          onCustomRuleModeChange={onCustomRuleModeChange}
          onCustomWeekdayChange={onCustomWeekdayChange}
          disabled={disabled}
        />
      )}
    </FormControl>
  );
};

function formatFrequency(frequency: Frequency, t: TFunction): string {
  switch (frequency) {
    case Frequency.DAILY:
      return t('recurrenceEditor.custom.frequency.days', 'Days');
    case Frequency.WEEKLY:
      return t('recurrenceEditor.custom.frequency.weeks', 'Weeks');
    case Frequency.MONTHLY:
      return t('recurrenceEditor.custom.frequency.months', 'Months');
    case Frequency.YEARLY:
      return t('recurrenceEditor.custom.frequency.years', 'Years');
    default:
      throw new Error('Unsupported frequency');
  }
}
