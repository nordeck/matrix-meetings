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
import { Alert } from '@mui/material';
import { PropsWithChildren, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Meeting } from '../../../reducer/meetingsApi';

/**
 * Props for the {@link MeetingInvitationGuard} component.
 */
type MeetingInvitationGuardProps = PropsWithChildren<{
  /** the meeting use check */
  meeting: Meeting;
}>;

/**
 * Replace the children with a warning if the user is only invited
 * to the meeting but didn't join it. This can be helpful to guard
 * views or edit operations that might suffer from inconsistencies
 * because the data that is included in the invitations is never
 * updated.
 *
 * @param param0 - {@link MeetingInvitationGuardProps}
 */
export function MeetingInvitationGuard({
  meeting,
  children,
}: MeetingInvitationGuardProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const isMeetingInvitation = meeting.participants.some(
    (p) =>
      p.userId === widgetApi.widgetParameters.userId &&
      p.membership === 'invite',
  );

  if (isMeetingInvitation) {
    return (
      <Alert icon={false} role="status" severity="info">
        {t(
          'meetingInvitationGuard.meetingInvitation',
          'Please accept the meeting invitation to see all the details.',
        )}
      </Alert>
    );
  }

  return <>{children}</>;
}
