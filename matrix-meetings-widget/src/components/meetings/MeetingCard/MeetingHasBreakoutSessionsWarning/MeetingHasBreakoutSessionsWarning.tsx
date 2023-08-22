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

import { Alert, AlertTitle } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Meeting,
  isMeetingRoom,
  makeSelectHasBreakoutSessions,
} from '../../../../reducer/meetingsApi';
import { useAppSelector } from '../../../../store';

/**
 * Props for the {@link MeetingHasBreakoutSessionsWarning} component.
 */
type MeetingHasBreakoutSessionsWarningProps = {
  /** the meeting */
  meeting: Meeting;
};

/**
 * Show a warning if the meeting already has breakout sessions.
 *
 * @remarks The warning hints to the user that changes to the
 *          start and end time will not be propagated to breakout
 *          sessions.
 *
 * @param param0 - {@link MeetingHasBreakoutSessionsWarningProps}
 */
export function MeetingHasBreakoutSessionsWarning({
  meeting,
}: MeetingHasBreakoutSessionsWarningProps) {
  const { t } = useTranslation();

  const selectHasBreakoutSessions = useMemo(makeSelectHasBreakoutSessions, []);
  const meetingHasBreakoutSessions = useAppSelector((state) =>
    selectHasBreakoutSessions(state, meeting.meetingId)
  );

  return (
    <>
      {isMeetingRoom(meeting.type) && meetingHasBreakoutSessions && (
        <Alert role="status" severity="warning" sx={{ my: 1 }}>
          <AlertTitle>
            {t(
              'meetingHasBreakoutSessionsWarning.title',
              'The meeting already has breakout sessions.'
            )}
          </AlertTitle>
          {t(
            'meetingHasBreakoutSessionsWarning.message',
            'If you want to change start or end time of this meeting, existing breakout sessions will not be moved!'
          )}
        </Alert>
      )}
    </>
  );
}
