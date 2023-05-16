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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarViewType, generateFilterRange } from '../../../lib/utils';
import {
  Filters,
  makeSelectAllInvitedMeetingIds,
  makeSelectHasBreakoutSessions,
  makeSelectRoomPermissions,
  makeSelectRoomType,
  RoomType,
} from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { InvitedMeetingsList } from '../InvitedMeetingsList';
import { MeetingsCalendar } from '../MeetingsCalendar';
import { MeetingsFilter } from '../MeetingsFilter';
import { MeetingsList } from '../MeetingsList';
import { ViewType } from '../MeetingsNavigation';
import { MeetingsToolbar } from '../MeetingsToolbar';
import { BreakoutSessionsMessageForm } from './BreakoutSessionsMessageForm';
import { CreateBreakoutSessionsForm } from './CreateBreakoutSessionsForm';
import { ToggleListView } from './ToggleListView';

export const MeetingsPanel = () => {
  const displayAllMeetings =
    getEnvironment('REACT_APP_DISPLAY_ALL_MEETINGS', 'false') === 'true';

  const widgetApi = useWidgetApi();
  const { t } = useTranslation();

  const selectRoomPermissions = useMemo(makeSelectRoomPermissions, []);
  const { canCreateBreakoutSessions } = useAppSelector((state) =>
    selectRoomPermissions(
      state,
      widgetApi.widgetParameters.roomId ?? '',
      widgetApi.widgetParameters.userId
    )
  );

  const [view, setView] = useState<ViewType>(
    () => readLastViewTypeFromStorage(widgetApi) ?? 'list'
  );
  const [filters, setFilters] = useState<Filters>({
    startDate: DateTime.now().startOf('day').toISO(),
    endDate: DateTime.now().plus({ days: 6 }).endOf('day').toISO(),
    filterText: '',
  });

  useEffect(() => {
    saveLastViewTypeToStorage(widgetApi, view);
  }, [view, widgetApi]);

  useEffect(() => {
    if (view !== 'list') {
      setFilters((oldFilters) => ({
        ...oldFilters,
        ...generateFilterRange(view, oldFilters.startDate),
      }));
    }
  }, [setFilters, view]);

  const handleChangeMonthToWeekInterval = useCallback(
    (view: CalendarViewType) => {
      const startDate = DateTime.fromISO(filters.startDate, { zone: 'local' });
      setFilters((oldFilters) => ({
        ...oldFilters,
        ...generateFilterRange(
          view,
          startDate.day === 1 && startDate.day !== startDate.startOf('week').day
            ? startDate.plus({ week: 1 }).toISO()
            : oldFilters.startDate
        ),
      }));
    },
    [filters.startDate]
  );

  const handleViewChange = useCallback(
    (view) => {
      setView(view);
      if (view === 'week' || view === 'workWeek') {
        if (readLastViewTypeFromStorage(widgetApi) === 'month') {
          handleChangeMonthToWeekInterval(view);
        }
      }
    },
    [setView, handleChangeMonthToWeekInterval, widgetApi]
  );

  const handleOnRangeChange = useCallback(
    (startDate: string, endDate: string) =>
      setFilters((old) => ({ ...old, startDate, endDate })),
    [setFilters]
  );

  const handleOnSearchChange = useCallback(
    (filterText: string) => setFilters((old) => ({ ...old, filterText })),
    [setFilters]
  );

  const selectRoomType = useMemo(makeSelectRoomType, []);
  const roomType = useAppSelector((state): RoomType => {
    if (!widgetApi.widgetParameters.roomId) {
      return 'management';
    }

    return selectRoomType(state, widgetApi.widgetParameters.roomId);
  });

  const selectHasBreakoutSessions = useMemo(makeSelectHasBreakoutSessions, []);
  const hasBreakoutSessions = useAppSelector((state) => {
    if (!widgetApi.widgetParameters.roomId) {
      return false;
    }

    return selectHasBreakoutSessions(state, widgetApi.widgetParameters.roomId);
  });

  const selectAllInvitedMeetingIds = useMemo(
    () =>
      makeSelectAllInvitedMeetingIds({
        includeBreakoutSessions: roomType === 'meeting',
        skipMeetings: roomType === 'meeting',
        isChildOfRoomId: !displayAllMeetings
          ? widgetApi.widgetParameters.roomId
          : undefined,
        hasMemberId: widgetApi.widgetParameters.userId,
      }),
    [
      roomType,
      widgetApi.widgetParameters.roomId,
      widgetApi.widgetParameters.userId,
      displayAllMeetings,
    ]
  );
  const invitedMeetingIdLength = useAppSelector(
    (state) => selectAllInvitedMeetingIds(state).length
  );

  const [showInvitations, setShowInvitations] = useState(false);

  useEffect(() => {
    if (invitedMeetingIdLength === 0) {
      setShowInvitations(false);
    }
  }, [invitedMeetingIdLength]);

  const handleShowMore = useCallback((date: Date) => {
    setView('day');
    setFilters((old) => ({
      ...old,
      ...generateFilterRange('day', date.toISOString()),
    }));
  }, []);

  const filtersId = useId();
  const meetingsId = useId();
  const invitationsId = useId();
  const actionsId = useId();

  return (
    <Stack height="100%">
      {invitedMeetingIdLength > 0 && (
        <Box m={1} mb={0}>
          <Box maxWidth={327} mx="auto">
            <ToggleListView
              invitationsViewId={invitationsId}
              meetingsViewId={meetingsId}
              onChange={setShowInvitations}
              showInvitations={showInvitations}
            />
          </Box>
          <Divider />
        </Box>
      )}

      {!showInvitations && (
        <Box aria-labelledby={filtersId} component="nav" mx={1}>
          <Typography id={filtersId} sx={visuallyHidden} variant="h3">
            {t('meetingsPanel.filtersTitle', 'Filters')}
          </Typography>

          {roomType === 'management' ? (
            <Box my={1}>
              <MeetingsToolbar
                filters={filters}
                onRangeChange={handleOnRangeChange}
                onSearchChange={handleOnSearchChange}
                onViewChange={handleViewChange}
                view={view}
              />
            </Box>
          ) : (
            <Box maxWidth={327} mx="auto" my={1}>
              <MeetingsFilter filters={filters} onFiltersChange={setFilters} />
            </Box>
          )}
        </Box>
      )}

      <Box flexGrow={1} mb={view === 'list' ? 0 : 1} overflow="hidden">
        {showInvitations ? (
          <InvitedMeetingsList
            breakoutSessionMode={roomType === 'meeting'}
            id={invitationsId}
          />
        ) : view === 'list' ? (
          <Box height="100%" overflow="auto">
            <MeetingsList
              breakoutSessionMode={roomType === 'meeting'}
              displayAllMeetings={displayAllMeetings}
              filters={filters}
              hasInvitations={invitedMeetingIdLength > 0}
              id={meetingsId}
            />
          </Box>
        ) : (
          <MeetingsCalendar
            displayAllMeetings={displayAllMeetings}
            filters={filters}
            onShowMore={handleShowMore}
            view={view}
          />
        )}
      </Box>

      {roomType === 'meeting' &&
        (canCreateBreakoutSessions || hasBreakoutSessions) && (
          <Box aria-labelledby={actionsId} component="nav" px={1}>
            <Typography id={actionsId} sx={visuallyHidden} variant="h3">
              {t('meetingsPanel.actionsTitle', 'Actions')}
            </Typography>
            <Divider />

            {hasBreakoutSessions && (
              <Box maxWidth={500} mt={2} mx="auto">
                <BreakoutSessionsMessageForm />
              </Box>
            )}

            {canCreateBreakoutSessions && (
              <Box maxWidth={327} mx="auto" my={2}>
                <CreateBreakoutSessionsForm />
              </Box>
            )}
          </Box>
        )}
    </Stack>
  );
};

export function readLastViewTypeFromStorage(
  widgetApi: WidgetApi
): ViewType | undefined {
  try {
    const viewType = window.localStorage.getItem(
      `meeting_view_${widgetApi.widgetParameters.roomId}_${widgetApi.widgetParameters.userId}`
    );
    if (viewType && isViewType(viewType)) {
      return viewType;
    }
  } catch (e) {
    console.error('readLastViewTypeFromStorage', e);
  }
  return undefined;
}

export function saveLastViewTypeToStorage(
  widgetApi: WidgetApi,
  view: ViewType
): void {
  try {
    window.localStorage.setItem(
      `meeting_view_${widgetApi.widgetParameters.roomId}_${widgetApi.widgetParameters.userId}`,
      view
    );
  } catch (e) {
    console.error('saveLastViewTypeToStorage', e);
  }
}

export function isViewType(view: string): view is ViewType {
  return ['list', 'day', 'workWeek', 'week', 'month'].includes(view);
}
