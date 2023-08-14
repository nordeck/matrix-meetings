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
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { Info } from 'luxon';
import { ChangeEvent, Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomRuleMode } from '../state';
import { MonthSelect } from './MonthSelect';
import { getOrdinalLabel, OrdinalSelect } from './OrdinalSelect';
import { WeekdaySelect } from './WeekdaySelect';

type CustomYearlyRecurringMeetingProps = {
  customRuleMode: CustomRuleMode;
  customMonth: number;
  customNthMonthday: string;
  customWeekday: number;
  customNth: number;
  onCustomRuleModeChange: Dispatch<CustomRuleMode>;
  onCustomMonthChange: Dispatch<number>;
  onCustomNthMonthdayChange: Dispatch<string>;
  onCustomWeekdayChange: Dispatch<number>;
  onCustomNthChange: Dispatch<number>;
};

export const CustomYearlyRecurringMeeting = ({
  customRuleMode,
  customMonth,
  customNthMonthday,
  customWeekday,
  customNth,
  onCustomRuleModeChange,
  onCustomMonthChange,
  onCustomNthMonthdayChange,
  onCustomWeekdayChange,
  onCustomNthChange,
}: CustomYearlyRecurringMeetingProps) => {
  const { t } = useTranslation();
  const customNthMonthdayParsed = parseInt(customNthMonthday);
  const isCustomNthMonthdayInvalid =
    isNaN(customNthMonthdayParsed) ||
    customNthMonthdayParsed < 1 ||
    customNthMonthdayParsed > 31;

  const handleCustomRuleModeChange = useCallback(
    (e: SelectChangeEvent<CustomRuleMode>) => {
      onCustomRuleModeChange(e.target.value as CustomRuleMode);
    },
    [onCustomRuleModeChange]
  );

  const handleCustomNthMonthdayChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onCustomNthMonthdayChange(e.target.value);
    },
    [onCustomNthMonthdayChange]
  );

  const radioGroupLabelId = useId();
  const byMonthdayRadioId = useId();
  const byWeekdayRadioId = useId();

  return (
    <FormControl margin="dense">
      <FormLabel id={radioGroupLabelId} sx={visuallyHidden}>
        {t('recurrenceEditor.custom.yearly.customRuleMode', 'Custom Rule')}
      </FormLabel>
      <RadioGroup
        aria-labelledby={radioGroupLabelId}
        name="customRuleMode"
        onChange={handleCustomRuleModeChange}
        value={customRuleMode}
      >
        <Stack direction="row" flexWrap="wrap">
          <FormControlLabel
            control={
              <Radio
                id={byMonthdayRadioId}
                inputProps={{
                  'aria-label': t(
                    'recurrenceEditor.custom.yearly.byMonthdayLong',
                    'The meeting is repeated yearly on {{nthMonthday}} {{month}}',
                    {
                      nthMonthday: customNthMonthday,
                      month: Info.months()[customMonth - 1],
                    }
                  ),
                }}
              />
            }
            label={
              // Make sure that the label text is NOT read by the screen reader,
              // instead we read the aria-label above
              <span aria-hidden>
                {t('recurrenceEditor.custom.yearly.byMonthday', 'On day')}
              </span>
            }
            value={CustomRuleMode.ByMonthday}
          />
          <Stack
            alignItems="baseline"
            aria-labelledby={byMonthdayRadioId}
            direction="row"
            flexWrap="wrap"
            role="group"
            spacing={1}
          >
            <TextField
              disabled={customRuleMode !== CustomRuleMode.ByMonthday}
              error={isCustomNthMonthdayInvalid}
              helperText={
                isCustomNthMonthdayInvalid &&
                t(
                  'recurrenceEditor.custom.yearly.invalidInput',
                  'Invalid input'
                )
              }
              inputProps={{
                'aria-label': t(
                  'recurrenceEditor.custom.yearly.monthdayInput',
                  'Day'
                ),
                inputMode: 'numeric',
                type: 'number',
                min: 1,
                max: 31,
              }}
              margin="dense"
              onChange={handleCustomNthMonthdayChange}
              value={customNthMonthday}
            />
            <MonthSelect
              disabled={customRuleMode !== CustomRuleMode.ByMonthday}
              month={customMonth}
              onMonthChange={onCustomMonthChange}
            />
          </Stack>
        </Stack>

        <Stack direction="row" flexWrap="wrap">
          <FormControlLabel
            control={
              <Radio
                id={byWeekdayRadioId}
                inputProps={{
                  'aria-label': t(
                    'recurrenceEditor.custom.yearly.byWeekdayLong',
                    'The meeting is repeated yearly at {{ordinal}} {{weekday}} of {{month}}',
                    {
                      ordinal: getOrdinalLabel(customNth, t),
                      weekday: Info.weekdays()[customWeekday],
                      month: Info.months()[customMonth - 1],
                    }
                  ),
                }}
              />
            }
            label={
              // Make sure that the label text is NOT read by the screen reader,
              // instead we read the aria-label above
              <span aria-hidden>
                {t('recurrenceEditor.custom.yearly.byWeekday', 'On the')}
              </span>
            }
            value={CustomRuleMode.ByWeekday}
          />
          <Stack
            alignItems="baseline"
            aria-labelledby={byWeekdayRadioId}
            direction="row"
            flexWrap="wrap"
            role="group"
            spacing={1}
          >
            <OrdinalSelect
              disabled={customRuleMode !== CustomRuleMode.ByWeekday}
              onOrdinalChange={onCustomNthChange}
              ordinal={customNth}
            />
            <WeekdaySelect
              disabled={customRuleMode !== CustomRuleMode.ByWeekday}
              onWeekdayChange={onCustomWeekdayChange}
              weekday={customWeekday}
            />
            <span>{t('recurrenceEditor.custom.yearly.byWeekdayOf', 'of')}</span>
            <MonthSelect
              disabled={customRuleMode !== CustomRuleMode.ByWeekday}
              month={customMonth}
              onMonthChange={onCustomMonthChange}
            />
          </Stack>
        </Stack>
      </RadioGroup>
    </FormControl>
  );
};
