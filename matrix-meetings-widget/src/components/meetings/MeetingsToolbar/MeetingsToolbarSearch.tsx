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
import { InputAdornment, TextField } from '@mui/material';
import { ChangeEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type MeetingsToolbarSearchProps = {
  search: string;
  onSearchChange: (search: string) => void;
};

export const MeetingsToolbarSearch = ({
  search,
  onSearchChange,
}: MeetingsToolbarSearchProps) => {
  const { t } = useTranslation();

  const handleOnChangeChangeText = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange],
  );

  return (
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
        'aria-label': t('meetingsToolbar.filterAriaLabel', 'Search'),
      }}
      onChange={handleOnChangeChangeText}
      placeholder={t('meetingsToolbar.filterPlaceholder', 'Search…')}
      size="small"
      sx={{
        minWidth: '10rem',
        maxWidth: '35rem',
      }}
      value={search}
    />
  );
};
