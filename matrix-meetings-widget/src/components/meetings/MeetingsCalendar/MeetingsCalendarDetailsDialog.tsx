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

import { Dialog } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { DispatchWithoutAction, useMemo } from 'react';
import { makeSelectMeeting } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { MeetingDetails } from '../MeetingDetails';

export function MeetingsCalendarDetailsDialog({
  meetingId,
  onClose,
}: {
  meetingId:
    | { meetingId: string; uid: string; recurrenceId?: string }
    | undefined;
  onClose: DispatchWithoutAction;
}) {
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
      fullScreen
      PaperProps={{
        sx: {
          m: 0,
          background: (theme) => theme.palette.background.default,
        },
      }}
      aria-labelledby={titleId}
      aria-describedby={meetingTimeId}
      onClose={onClose}
      open={meetingId !== undefined}
    >
      <MeetingDetails
        meetingTimeId={meetingTimeId}
        recurrenceId={meetingId?.recurrenceId}
        roomId={meetingId?.meetingId}
        titleId={titleId}
        uid={meetingId?.uid}
        onClose={onClose}
      />
    </Dialog>
  );
}
