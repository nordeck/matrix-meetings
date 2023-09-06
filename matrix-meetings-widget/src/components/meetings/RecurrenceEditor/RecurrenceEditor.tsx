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

import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { TFunction } from 'i18next';
import { DateTime } from 'luxon';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Frequency } from 'rrule';
import { CustomRecurringMeeting } from './CustomRecurringMeeting';
import { RecurringMeetingEnd } from './RecurringMeetingEnd';
import {
  CustomRuleMode,
  RecurrenceEnd,
  RecurrencePreset,
  useRecurrenceEditorState,
} from './state';
import { formatRRuleText } from './utils';

type RecurrenceEditorProps = {
  startDate: Date;
  onChange: (
    rrule: string | undefined,
    isValid: boolean,
    isDirty: boolean,
  ) => void;
  rule: string | undefined;
  isMeetingCreation?: boolean;
  disabled?: boolean;
};

export const RecurrenceEditor = ({
  startDate,
  onChange,
  rule,
  isMeetingCreation = true,
  disabled,
}: RecurrenceEditorProps) => {
  const { t } = useTranslation();
  const { state, rrule, isValid, dispatch } = useRecurrenceEditorState(
    rule,
    startDate,
  );

  useEffect(() => {
    dispatch({ type: 'updateStartDate', startDate, isMeetingCreation });
  }, [dispatch, isMeetingCreation, startDate]);

  useEffect(() => {
    onChange(rrule, isValid, state.isDirty);
  }, [rrule, isValid, onChange, state.isDirty]);

  const handleRecurrencePresetChange = useCallback(
    (event: SelectChangeEvent<RecurrencePreset>) => {
      const recurrencePreset = event.target.value as RecurrencePreset;
      dispatch({ type: 'updateRecurrencePreset', recurrencePreset });
    },
    [dispatch],
  );

  const handleCustomFrequencyChange = useCallback(
    (customFrequency: Frequency) => {
      dispatch({ type: 'updateCustomFrequency', customFrequency });
    },
    [dispatch],
  );

  const handleCustomIntervalChange = useCallback(
    (customInterval: string) => {
      dispatch({ type: 'updateCustomInterval', customInterval });
    },
    [dispatch],
  );

  const handleCustomByWeekdayChange = useCallback(
    (customByWeekday: number[]) => {
      dispatch({ type: 'updateCustomByWeekday', customByWeekday });
    },
    [dispatch],
  );

  const handleCustomRuleModeChange = useCallback(
    (customRuleMode: CustomRuleMode) => {
      dispatch({ type: 'updateCustomRuleMode', customRuleMode });
    },
    [dispatch],
  );

  const handleCustomMonthChange = useCallback(
    (customMonth: number) => {
      dispatch({ type: 'updateCustomMonth', customMonth });
    },
    [dispatch],
  );

  const handleCustomNthMonthdayChange = useCallback(
    (customNthMonthday: string) => {
      dispatch({ type: 'updateCustomNthMonthday', customNthMonthday });
    },
    [dispatch],
  );

  const handleCustomWeekdayChange = useCallback(
    (customWeekday: number) => {
      dispatch({ type: 'updateCustomWeekday', customWeekday });
    },
    [dispatch],
  );

  const handleCustomNthChange = useCallback(
    (customNth: number) => {
      dispatch({ type: 'updateCustomNth', customNth });
    },
    [dispatch],
  );

  const handleRecurrenceEndChange = useCallback(
    (recurrenceEnd: RecurrenceEnd) => {
      dispatch({ type: 'updateRecurrenceEnd', recurrenceEnd });
    },
    [dispatch],
  );

  const handleUntilDateChange = useCallback(
    (untilDate: DateTime) => {
      dispatch({ type: 'updateUntilDate', untilDate });
    },
    [dispatch],
  );

  const handleAfterMeetingCountChange = useCallback(
    (afterMeetingCount: string) => {
      dispatch({ type: 'updateAfterMeetingCount', afterMeetingCount });
    },
    [dispatch],
  );

  const renderValue = useCallback(
    (value: RecurrencePreset) => {
      if (rrule) {
        return formatRRuleText(rrule, t);
      }

      return formatRepetitionType(value, t);
    },
    [rrule, t],
  );

  const repetitionLabelId = useId();
  const selectId = useId();
  const repetitionLabelText = t(
    'recurrenceEditor.repeatMeeting',
    'Repeat meeting',
  );

  return (
    <>
      <FormControl fullWidth margin="dense" size="small" sx={{ mb: 0 }}>
        <InputLabel id={repetitionLabelId}>{repetitionLabelText}</InputLabel>
        <Select
          id={selectId}
          // Duplicate label is required to fix select box border
          label={repetitionLabelText}
          labelId={repetitionLabelId}
          onChange={handleRecurrencePresetChange}
          renderValue={renderValue}
          value={state.recurrencePreset}
          disabled={disabled}
        >
          {Object.values(RecurrencePreset).map((v, i) => (
            <MenuItem key={i} value={v}>
              {formatRepetitionType(v, t)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {state.recurrencePreset !== RecurrencePreset.Once && (
        <Stack direction="row" mt={2}>
          <Typography color="text.secondary" component="div" px={2}>
            <EventRepeatIcon />
          </Typography>

          <div>
            {state.recurrencePreset === RecurrencePreset.Custom && (
              <CustomRecurringMeeting
                customByWeekday={state.customByWeekday}
                customFrequency={state.customFrequency}
                customInterval={state.customInterval}
                customMonth={state.customMonth}
                customNth={state.customNth}
                customNthMonthday={state.customNthMonthday}
                customRuleMode={state.customRuleMode}
                customWeekday={state.customWeekday}
                onCustomByWeekdayChange={handleCustomByWeekdayChange}
                onCustomFrequencyChange={handleCustomFrequencyChange}
                onCustomIntervalChange={handleCustomIntervalChange}
                onCustomMonthChange={handleCustomMonthChange}
                onCustomNthChange={handleCustomNthChange}
                onCustomNthMonthdayChange={handleCustomNthMonthdayChange}
                onCustomRuleModeChange={handleCustomRuleModeChange}
                onCustomWeekdayChange={handleCustomWeekdayChange}
                disabled={disabled}
              />
            )}

            <RecurringMeetingEnd
              afterMeetingCount={state.afterMeetingCount}
              onAfterMeetingCountChange={handleAfterMeetingCountChange}
              onRecurrenceEndChange={handleRecurrenceEndChange}
              onUntilDateChange={handleUntilDateChange}
              recurrenceEnd={state.recurrenceEnd}
              startDate={state.startDate}
              untilDate={state.untilDate}
              disabled={disabled}
            />
          </div>
        </Stack>
      )}
    </>
  );
};

function formatRepetitionType(preset: RecurrencePreset, t: TFunction): string {
  switch (preset) {
    case RecurrencePreset.Daily:
      return t('recurrenceEditor.recurrencePreset.daily', 'Daily');
    case RecurrencePreset.Weekly:
      return t('recurrenceEditor.recurrencePreset.weekly', 'Weekly');
    case RecurrencePreset.Monthly:
      return t('recurrenceEditor.recurrencePreset.monthly', 'Monthly');
    case RecurrencePreset.MondayToFriday:
      return t(
        'recurrenceEditor.recurrencePreset.mondayToFriday',
        'Monday to Friday',
      );
    case RecurrencePreset.Yearly:
      return t('recurrenceEditor.recurrencePreset.yearly', 'Yearly');
    case RecurrencePreset.Custom:
      return t('recurrenceEditor.recurrencePreset.custom', 'Custom');
    case RecurrencePreset.Once:
    default:
      return t('recurrenceEditor.recurrencePreset.once', 'No repetition');
  }
}
