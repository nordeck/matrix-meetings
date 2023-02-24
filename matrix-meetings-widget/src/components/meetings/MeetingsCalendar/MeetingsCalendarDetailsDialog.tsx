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

import CloseIcon from '@mui/icons-material/Close';
import { Dialog, IconButton } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { DispatchWithoutAction, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { makeSelectMeeting } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { MeetingCard } from '../MeetingCard';

export function MeetingsCalendarDetailsDialog({
  meetingId,
  onClose,
}: {
  meetingId:
    | { meetingId: string; uid: string; recurrenceId?: string }
    | undefined;
  onClose: DispatchWithoutAction;
}) {
  const { t } = useTranslation();

  const selectMeeting = useMemo(makeSelectMeeting, []);
  useAppSelector((state) => {
    if (meetingId) {
      const meeting = selectMeeting(
        state,
        meetingId.meetingId,
        meetingId.uid,
        meetingId.recurrenceId
      );
      if (!meeting) {
        onClose();
      }
    }
  });

  const titleId = useId();
  const meetingTimeId = useId();

  return (
    <Dialog
      PaperProps={{
        sx: {
          // Make sure the card has a fixed max width
          width: 'min(327px, 100% - 16px)',
          // Make the time distance component work
          overflowY: 'visible',
        },
      }}
      aria-describedby={meetingTimeId}
      aria-labelledby={titleId}
      onClose={onClose}
      open={meetingId !== undefined}
      scroll="body"
    >
      <MeetingCard
        cardHeaderButtons={
          <IconButton
            aria-describedby={titleId}
            aria-label={t('meetingsCalendar.dialog.close', 'Close')}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        }
        headingComponent="h3"
        meetingTimeId={meetingTimeId}
        recurrenceId={meetingId?.recurrenceId}
        roomId={meetingId?.meetingId}
        showOpenMeetingRoomButton
        titleId={titleId}
        uid={meetingId?.uid}
      />
    </Dialog>
  );
}
