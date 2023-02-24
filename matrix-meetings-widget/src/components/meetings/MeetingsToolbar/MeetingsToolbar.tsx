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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { Box, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';
import {
  Filters,
  makeSelectRoomPermissions,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { MeetingsNavigation, ViewType } from '../MeetingsNavigation';
import { CreateMeetingForm } from '../MeetingsPanel/CreateMeetingForm';
import { MeetingsToolbarButtons } from './MeetingsToolbarButtons';
import { MeetingsToolbarDatePicker } from './MeetingsToolbarDatePicker';
import { MeetingsToolbarSearch } from './MeetingsToolbarSearch';

type MeetingsToolbarProps = {
  filters: Filters;
  view: ViewType;
  onRangeChange: (startDate: string, endDate: string) => void;
  onSearchChange: (search: string) => void;
  onViewChange: (view: ViewType) => void;
};

export const MeetingsToolbar = ({
  filters,
  view,
  onRangeChange,
  onSearchChange,
  onViewChange,
}: MeetingsToolbarProps) => {
  const widgetApi = useWidgetApi();

  const selectRoomPermissions = useMemo(makeSelectRoomPermissions, []);
  const { canCreateMeeting } = useAppSelector((state) =>
    selectRoomPermissions(
      state,
      widgetApi.widgetParameters.roomId ?? '',
      widgetApi.widgetParameters.userId
    )
  );

  const theme = useTheme();
  const showToolBarButtons = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {canCreateMeeting && <CreateMeetingForm sx={{ flexGrow: 1 }} />}

      {showToolBarButtons && (
        <Box>
          <MeetingsToolbarButtons
            endDate={filters.endDate}
            onRangeChange={onRangeChange}
            startDate={filters.startDate}
            view={view}
          />
        </Box>
      )}

      <MeetingsToolbarDatePicker
        endDate={filters.endDate}
        onRangeChange={onRangeChange}
        startDate={filters.startDate}
        sx={{ flexGrow: 1 }}
        view={view}
      />

      <Box
        // use a very large flex value so the search will always fill the
        // remaining space in their row. in other rows, the remaining
        // components can fill the space
        flex={99999999}
        textAlign="right"
      >
        <MeetingsToolbarSearch
          onSearchChange={onSearchChange}
          search={filters.filterText ?? ''}
        />
      </Box>

      <MeetingsNavigation
        onViewChange={onViewChange}
        sx={{ flexGrow: 1 }}
        view={view}
      />
    </Stack>
  );
};
