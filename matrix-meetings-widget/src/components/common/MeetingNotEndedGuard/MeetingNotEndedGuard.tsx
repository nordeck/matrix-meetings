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

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Alert } from '@mui/material';
import { getCalendarEvent } from '@nordeck/matrix-meetings-calendar';
import { DateTime } from 'luxon';
import React, {
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { isMeetingBreakOutRoom, Meeting } from '../../../reducer/meetingsApi';
import { useUpdateOnDate } from '../hooks';

/**
 * Props for the {@link MeetingNotEndedGuard} component.
 */
type MeetingNotEndedGuardProps = PropsWithChildren<{
  /** the meeting use check */
  meeting: Meeting | undefined;

  /**
   * Show a message to the user to tell that a meeting ended.
   * Provide a string to override the default message.
   */
  withMessage?: boolean | ReactNode;
}>;

/**
 * Replace the children with a warning if the meeting is ended.
 * This can be helpful to guard edit operations that should only
 * be available if a meeting has not ended yet.
 *
 * @param param0 - {@link MeetingNotEndedGuardProps}
 */
export function MeetingNotEndedGuard({
  meeting,
  children,
  withMessage = false,
}: MeetingNotEndedGuardProps): ReactElement {
  const { t } = useTranslation();

  const endTime = meeting
    ? getCalendarEvent(
        meeting.calendarEntries,
        meeting.calendarUid,
        meeting?.recurrenceId,
      )?.endTime
    : undefined;

  // Make sure this component is rerendered (and the now below re-evaluated)
  // after the meeting ended.
  useUpdateOnDate(endTime);

  if (meeting && endTime && DateTime.now() >= DateTime.fromISO(endTime)) {
    if (!withMessage) {
      return <React.Fragment />;
    }

    if (typeof withMessage === 'string') {
      return (
        <Alert role="status" severity="info">
          {withMessage}
        </Alert>
      );
    }

    if (isValidElement(withMessage)) {
      return <Alert children={withMessage} role="status" severity="info" />;
    }

    const isBreakOutRoom = isMeetingBreakOutRoom(meeting.type);
    return (
      <Alert
        icon={<AccessTimeIcon />}
        role="status"
        severity="info"
        sx={{ mx: 1 }}
      >
        {isBreakOutRoom
          ? t(
              'meetingViewEditMeeting.breakoutSessionIsOver',
              'The breakout session is already over and cannot be changed.',
            )
          : t(
              'meetingViewEditMeeting.meetingIsOver',
              'The meeting is already over and cannot be changed.',
            )}
      </Alert>
    );
  }

  return <>{children}</>;
}
