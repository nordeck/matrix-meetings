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

//TODO: flex wrap, flex box

import { Dialog, Divider, useMediaQuery } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { DispatchWithoutAction, useMemo } from 'react';
import { makeSelectMeeting } from '../../../reducer/meetingsApi';
import { useAppSelector } from '../../../store';
import { MeetingCalenderDetailsContent } from './MeetingCalenderDetails/MeetingCalenderDetailsContent';
import { MeetingCalenderDetailsHeader } from './MeetingCalenderDetails/MeetingCalenderDetailsHeader';

export function MeetingsCalendarDetailsDialog({
  meetingId,
  onClose,
}: {
  meetingId:
    | { meetingId: string; uid: string; recurrenceId?: string }
    | undefined;
  onClose: DispatchWithoutAction;
}) {
  const isBigWindow = useMediaQuery('(min-width:550px)', { noSsr: true });
  const selectMeeting = useMemo(makeSelectMeeting, []);
  const meeting = useAppSelector((state) => {
    if (!meetingId) {
      return undefined;
    }

    return selectMeeting(
      state,
      meetingId.meetingId,
      meetingId.uid,
      meetingId.recurrenceId
    );
  });

  const dialogTitleId = useId();

  if (!meeting) {
    onClose();
    return <></>;
  }

  return (
    <Dialog
      fullScreen
      PaperProps={{
        sx: {
          m: 0,
          background: (theme) => theme.palette.background.default,
        },
      }}
      aria-labelledby={dialogTitleId}
      onClose={onClose}
      open={meetingId !== undefined}
    >
      <MeetingCalenderDetailsHeader
        meeting={meeting}
        onClose={onClose}
        aria-describedby={dialogTitleId}
        isBigWindow={isBigWindow}
      />
      <Divider variant="middle" />
      <MeetingCalenderDetailsContent
        meeting={meeting}
        isBigWindow={isBigWindow}
      />
    </Dialog>
  );
}
