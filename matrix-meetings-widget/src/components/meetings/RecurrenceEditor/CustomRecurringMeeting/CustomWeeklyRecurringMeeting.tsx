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
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { sortBy } from 'lodash-es';
import React, { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { localeWeekdays } from '../../../../lib/utils';
import { convertWeekdayFromLocaleToRRule } from '../utils';

type CustomWeeklyRecurringMeetingProps = {
  onByWeekdayChange: Dispatch<Array<number>>;
  byWeekday: Array<number>;
  disabled?: boolean;
};

export const CustomWeeklyRecurringMeeting = ({
  onByWeekdayChange,
  byWeekday,
  disabled,
}: CustomWeeklyRecurringMeetingProps) => {
  const { t } = useTranslation();

  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSelectedWeekDaysChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newWeekdays: number[]) => {
      onByWeekdayChange(sortBy(newWeekdays));
    },
    [onByWeekdayChange],
  );

  const toggleButtonGroupLabelId = useId();

  return (
    <FormControl disabled={disabled} sx={{ my: 1 }}>
      <FormLabel id={toggleButtonGroupLabelId}>
        {t(
          'recurrenceEditor.custom.weekly.repeatOnWeekday',
          'Repeat on weekday',
        )}
      </FormLabel>
      <ToggleButtonGroup
        aria-labelledby={toggleButtonGroupLabelId}
        color="primary"
        fullWidth
        onChange={handleSelectedWeekDaysChange}
        orientation={!matches ? 'horizontal' : 'vertical'}
        size="small"
        sx={{ mt: 1 }}
        value={byWeekday}
        disabled={disabled}
      >
        {localeWeekdays().map((m, i) => (
          <ToggleButton key={i} value={convertWeekdayFromLocaleToRRule(i)}>
            {m}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </FormControl>
  );
};
