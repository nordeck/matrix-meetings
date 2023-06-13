/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { List, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isBotUser } from '../../../../lib/utils';
import { MeetingParticipant } from '../../../../reducer/meetingsApi';
import { sortByNameAndStatus } from '../../MeetingCardEditParticipantsContent/MeetingCardEditParticipantsContent';
import { MeetingCalenderDetailsParticipant } from './MeetingCalenderDetailsParticipant';

export type ParticipantDetails = {
  userId: string;
  membership: 'invite' | 'join';
  displayName?: string;
  avatarUrl?: string;
};

export function MeetingCalenderDetailsParticipants({
  participants,
  creator,
}: {
  participants: MeetingParticipant[];
  creator: string;
}) {
  const { t } = useTranslation();
  const roomCreator = participants.filter((p) => p.userId === creator)[0];

  return (
    <>
      <Typography
        component="h4"
        fontSize="inherit"
        fontWeight="bold"
        display="block"
        mb={1}
      >
        {t('meetingCalenderDetails.content.participants', 'Participants')}
      </Typography>
      <List>
        <MeetingCalenderDetailsParticipant
          participant={roomCreator}
          isOrganizer
        />
        {participants
          .filter((r) => !isBotUser(r.userId) && r.userId !== creator)
          .sort(sortByNameAndStatus)
          .map((p) => (
            <MeetingCalenderDetailsParticipant participant={p} key={p.userId} />
          ))}
      </List>
    </>
  );
}
