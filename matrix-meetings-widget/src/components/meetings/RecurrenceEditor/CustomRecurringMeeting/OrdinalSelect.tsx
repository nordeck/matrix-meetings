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
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { getOrdinalLabel as calendarGetOrdinalLabel } from '@nordeck/matrix-meetings-calendar';
import { TFunction } from 'i18next';
import { Settings } from 'luxon';
import { Dispatch, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type OrdinalSelectProps = {
  disabled?: boolean;
  onOrdinalChange: Dispatch<number>;
  ordinal: number;
};

export const OrdinalSelect = ({
  disabled,
  onOrdinalChange,
  ordinal,
}: OrdinalSelectProps) => {
  const { t } = useTranslation();

  const handleMonthFreqChange = useCallback(
    (e: SelectChangeEvent<number>) => {
      onOrdinalChange(e.target.value as number);
    },
    [onOrdinalChange],
  );

  const labelId = useId();
  const selectId = useId();

  return (
    <FormControl disabled={disabled} margin="dense">
      <InputLabel id={labelId} sx={visuallyHidden}>
        {t('recurrenceEditor.ordinalLabel', 'Ordinal')}
      </InputLabel>

      <Select
        id={selectId}
        labelId={labelId}
        onChange={handleMonthFreqChange}
        value={ordinal}
      >
        {[1, 2, 3, 4, -1].map((i) => (
          <MenuItem key={i} value={i}>
            {getOrdinalLabel(i, t)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export function getOrdinalLabel(ordinal: number, t: TFunction) {
  return calendarGetOrdinalLabel(ordinal, t, Settings.defaultLocale);
}
