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
import { Stack, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { makeSelectAllInvitedMeetingIds } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { InvitedMeetingsListItem } from './InvitedMeetingsListItem';

/**
 * Props for the {@link InvitedMeetingsList} component.
 */
type InvitedMeetingsListProps = {
  id?: string;

  /**
   * If true, the components only shows breakout sessions.
   */
  breakoutSessionMode?: boolean;
};

/**
 * Renders a list of meeting invitations
 *
 * @param param0 - {@link InvitedMeetingsListProps}
 */
export function InvitedMeetingsList({
  id,
  breakoutSessionMode,
}: InvitedMeetingsListProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const selectAllInvitedMeetingIds = useMemo(
    () =>
      makeSelectAllInvitedMeetingIds({
        includeBreakoutSessions: breakoutSessionMode,
        skipMeetings: breakoutSessionMode,
        isChildOfRoomId: widgetApi.widgetParameters.roomId,
        hasMemberId: widgetApi.widgetParameters.userId,
      }),
    [
      breakoutSessionMode,
      widgetApi.widgetParameters.roomId,
      widgetApi.widgetParameters.userId,
    ],
  );
  const invitedMeetingIds = useAppSelector((state) =>
    selectAllInvitedMeetingIds(state),
  );

  const headingId = useId();

  return (
    <section aria-labelledby={headingId} id={id}>
      <Typography id={headingId} sx={visuallyHidden} variant="h3">
        {t('invitedMeetingsList.title', 'Invitations')}
      </Typography>

      <Stack
        aria-labelledby={headingId}
        component="ul"
        maxWidth={327}
        mx="auto"
        my={1}
        px={2}
        py={0}
        spacing={1}
      >
        {invitedMeetingIds.map((meetingId) => (
          <InvitedMeetingsListItem key={meetingId} meetingId={meetingId} />
        ))}
      </Stack>
    </section>
  );
}
