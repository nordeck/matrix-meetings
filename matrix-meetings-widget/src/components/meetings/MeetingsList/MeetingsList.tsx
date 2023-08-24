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
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { Alert, AlertTitle, Stack, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filters } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { ListEmptyState } from '../../common/ListEmptyState';
import { MeetingsListGroup } from './MeetingsListGroup';
import { MeetingsListItem } from './MeetingsListItem';
import { makeSelectDayMeetingIds } from './selectDayMeetingIds';

interface IMeetingListProps {
  id?: string;
  filters: Filters;
  breakoutSessionMode?: boolean;
  hasInvitations?: boolean;
  displayAllMeetings?: boolean;
}

export const MeetingsList = ({
  id,
  filters,
  breakoutSessionMode = false,
  hasInvitations = false,
  displayAllMeetings = false,
}: IMeetingListProps) => {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const selectDayMeetingIds = useMemo(
    () =>
      makeSelectDayMeetingIds({
        includeBreakoutSessions: breakoutSessionMode,
        skipMeetings: breakoutSessionMode,
        isChildOfRoomId:
          breakoutSessionMode || !displayAllMeetings
            ? widgetApi.widgetParameters.roomId
            : undefined,
        hasMemberId: widgetApi.widgetParameters.userId,
      }),
    [
      breakoutSessionMode,
      widgetApi.widgetParameters.roomId,
      widgetApi.widgetParameters.userId,
      displayAllMeetings,
    ],
  );

  const days = useAppSelector((state) => selectDayMeetingIds(state, filters));

  const headingId = useId();

  return (
    <section aria-labelledby={headingId} id={id}>
      <Typography id={headingId} sx={visuallyHidden} variant="h3">
        {t('meetingList.title', 'Meetings')}
      </Typography>

      {hasInvitations && (
        <Alert
          icon={<NotificationsNoneIcon />}
          role="status"
          severity="info"
          sx={{ maxWidth: 327, mx: 'auto' }}
        >
          <AlertTitle>
            {t(
              'meetingList.openInvitationsTitle',
              'You have open invitations.',
            )}
          </AlertTitle>
          {t(
            'meetingList.openInvitationsDetail',
            'Please join all meeting rooms.',
          )}
        </Alert>
      )}

      <Stack
        aria-labelledby={headingId}
        component="ul"
        m={0}
        p={0}
        sx={{
          // make sure all focusable elements are not
          // displayed behind the sticky headings
          'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),iframe,[tabindex],[contentEditable=true]':
            {
              '&:not([tabindex="-1"])': {
                scrollMarginTop: '50px',
              },
            },
        }}
      >
        {days.map(({ day, meetingIds }) => {
          return (
            <MeetingsListGroup date={day} key={day}>
              {meetingIds.map((meetingId) => (
                <MeetingsListItem
                  key={`${meetingId.id}${meetingId.uid}${meetingId.recurrenceId}`}
                  meetingId={meetingId.id}
                  recurrenceId={meetingId.recurrenceId}
                  uid={meetingId.uid}
                />
              ))}
            </MeetingsListGroup>
          );
        })}

        {!hasInvitations && days.length === 0 && (
          <ListEmptyState
            message={
              breakoutSessionMode
                ? t(
                    'meetingList.noBreakoutSessionsScheduled',
                    'No breakout sessions scheduled that match the selected filters.',
                  )
                : t(
                    'meetingList.noMeetingsScheduled',
                    'No meetings scheduled that match the selected filters.',
                  )
            }
          />
        )}
      </Stack>
    </section>
  );
};
