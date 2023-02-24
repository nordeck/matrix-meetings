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

import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, Stack, TextField } from '@mui/material';
import { isEqual } from 'lodash';
import moment from 'moment';
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Filters } from '../../../reducer/meetingsApi';
import { DateRangePicker } from '../../common/DateTimePickers';

type MeetingsFilterProps = {
  filters: Filters;
  onFiltersChange: Dispatch<SetStateAction<Filters>>;
};

export const MeetingsFilter = ({
  filters,
  onFiltersChange,
}: MeetingsFilterProps) => {
  const { t } = useTranslation();

  const [fromDate, setFromDate] = useState(() => moment(filters.startDate));
  const [toDate, setToDate] = useState(() => moment(filters.endDate));
  const [filterText, setFilterText] = useState(filters.filterText);

  useEffect(() => {
    setFromDate((old) => {
      const newDate = moment(filters.startDate);
      if (!newDate.isSame(old)) {
        return newDate;
      }

      return old;
    });
    setToDate((old) => {
      const newDate = moment(filters.endDate);
      if (!newDate.isSame(old)) {
        return newDate;
      }

      return old;
    });
    setFilterText(filters.filterText);
  }, [filters.endDate, filters.filterText, filters.startDate]);

  useEffect(() => {
    onFiltersChange((oldFilters) => {
      const newFilters = {
        startDate: fromDate.toISOString(),
        endDate: toDate.toISOString(),
        filterText,
      };

      if (!isEqual(oldFilters, newFilters)) {
        return newFilters;
      }

      return oldFilters;
    });
  }, [filterText, fromDate, onFiltersChange, toDate]);

  const handleOnChangeChangeText = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterText(event.target.value);
    },
    []
  );

  const handleOnRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      setFromDate(moment(startDate));
      setToDate(moment(endDate));
    },
    []
  );

  return (
    <Stack spacing={1}>
      <DateRangePicker
        endDate={toDate.toISOString()}
        onRangeChange={handleOnRangeChange}
        startDate={fromDate.toISOString()}
      />

      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
        inputProps={{
          'aria-label': t('meetingsFilter.filterAriaLabel', 'Search'),
        }}
        onChange={handleOnChangeChangeText}
        placeholder={t('meetingsFilter.filterPlaceholder', 'Search…')}
        value={filterText}
      />
    </Stack>
  );
};
