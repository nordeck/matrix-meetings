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

import { Box } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { MeetingCard } from '../MeetingCard';

type MeetingsListItemProps = {
  meetingId: string;
  uid: string;
  recurrenceId: string | undefined;
};

export function MeetingsListItem({
  meetingId,
  uid,
  recurrenceId,
}: MeetingsListItemProps) {
  const titleId = useId();
  const meetingTimeId = useId();

  return (
    <Box
      aria-describedby={meetingTimeId}
      aria-labelledby={titleId}
      component="li"
      m={0}
      p={0}
      position="relative"
      sx={{ listStyleType: 'none' }}
    >
      <MeetingCard
        meetingTimeId={meetingTimeId}
        recurrenceId={recurrenceId}
        roomId={meetingId}
        shortDateFormat
        showOpenMeetingRoomButton
        titleId={titleId}
        uid={uid}
      />
    </Box>
  );
}
